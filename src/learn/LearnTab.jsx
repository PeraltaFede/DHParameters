import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icons.jsx';
import { lerp, linkStd, toRad } from '../lib/dh.js';
import { JointScene } from '../three/JointScene.jsx';
import { Viewport } from '../three/Viewport.jsx';
import { compare, newPracticeTarget, nextHint } from './practice.js';
import { SequenceBar } from './SequenceBar.jsx';
import { STEPS } from './steps.jsx';

const DEFAULT_P = { type: 'R', theta: toRad(60), d: 0.6, a: 0.9, alpha: toRad(50) };
const PRACTICE_START = { type: 'R', theta: 0, d: 0, a: 0.5, alpha: 0 };
// Viewed from azimuth -60°: with theta = 60° neither the a segment nor the alpha arc is edge-on.
const CAMERA = { position: [1.88, -2.48, 2.14], target: [0.25, 0.35, 0.4] };
const PARAMS = ['theta', 'd', 'a', 'alpha'];

const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);

export default function LearnTab({ active }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [p, setP] = useState(DEFAULT_P);
  const [progress, setProgress] = useState(4);
  const [playing, setPlaying] = useState(false);
  const [showGhosts, setShowGhosts] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [viewKey, setViewKey] = useState(0);
  const [practice, setPractice] = useState(() => ({
    target: newPracticeTarget(),
    user: PRACTICE_START,
    solved: 0,
    hint: null,
    revealed: false,
  }));

  const raf = useRef(0);
  const pRef = useRef(p);
  useEffect(() => {
    pRef.current = p;
  }, [p]);

  const step = STEPS[stepIdx];

  /* ------------------------------------------------------------ animation */

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    setPlaying(false);
  }, []);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const animate = useCallback((duration, onFrame, onDone) => {
    cancelAnimationFrame(raf.current);
    setPlaying(true);
    const t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / duration);
      onFrame(k);
      if (k < 1) raf.current = requestAnimationFrame(tick);
      else {
        setPlaying(false);
        onDone?.();
      }
    };
    raf.current = requestAnimationFrame(tick);
  }, []);

  /** Animate the moving frame from `from` to `to` (0..4), easing through each elementary transform. */
  const playSeq = useCallback(
    (from, to) => {
      setProgress(from);
      animate(Math.max(600, Math.abs(to - from) * 1150), (k) => {
        const raw = lerp(from, to, k);
        const i = Math.min(Math.floor(raw), 3);
        setProgress(k >= 1 ? to : i + easeInOut(raw - i));
      });
    },
    [animate],
  );

  /** Swing the joint variable back and forth twice. */
  const wiggle = useCallback(() => {
    const base = pRef.current;
    const key = base.type === 'R' ? 'theta' : 'd';
    const amp = base.type === 'R' ? toRad(45) : 0.3;
    setProgress(4);
    animate(
      2600,
      (k) => setP((cur) => ({ ...cur, [key]: base[key] + amp * Math.sin(k * 4 * Math.PI) })),
      () => setP((cur) => ({ ...cur, [key]: base[key] })),
    );
  }, [animate]);

  /** Smoothly move some parameters to new values. */
  const tweenP = useCallback(
    (to) => {
      const from = pRef.current;
      setProgress(4);
      animate(700, (k) => {
        const e = easeInOut(k);
        const next = { ...from };
        for (const key of PARAMS) if (key in to) next[key] = lerp(from[key], to[key], e);
        setP(next);
      });
    },
    [animate],
  );

  const goTo = useCallback(
    (i) => {
      const s = STEPS[i];
      setStepIdx(i);
      if (s.seq && s.autoplay !== false) playSeq(s.seq[0], s.seq[1]);
      else {
        stop();
        setProgress(4);
      }
    },
    [playSeq, stop],
  );

  // Arrow keys move between steps.
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
      if (e.key === 'ArrowRight' && stepIdx < STEPS.length - 1) goTo(stepIdx + 1);
      if (e.key === 'ArrowLeft' && stepIdx > 0) goTo(stepIdx - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, stepIdx, goTo]);

  /* ------------------------------------------------------------- practice */

  const cmp = compare(practice.user, practice.target);
  const wasMatched = useRef(false);
  useEffect(() => {
    if (cmp.all && !wasMatched.current && !practice.revealed) {
      setPractice((pr) => ({ ...pr, solved: pr.solved + 1, hint: null }));
    }
    wasMatched.current = cmp.all;
  }, [cmp.all, practice.revealed]);

  const practiceCtx = {
    practice,
    setUser: (k, v) => setPractice((pr) => ({ ...pr, user: { ...pr.user, [k]: v }, hint: null })),
    newTarget: () =>
      setPractice((pr) => ({
        ...pr,
        target: newPracticeTarget(pr.target),
        user: PRACTICE_START,
        hint: null,
        revealed: false,
      })),
    showHint: () => setPractice((pr) => ({ ...pr, hint: nextHint(compare(pr.user, pr.target)) })),
    reveal: () => setPractice((pr) => ({ ...pr, user: { ...pr.target }, revealed: true, hint: null })),
  };

  /* ---------------------------------------------------------------- render */

  const ctx = {
    p,
    setParam: (k, v) => {
      stop();
      setProgress(4);
      setP((cur) => ({ ...cur, [k]: v }));
    },
    setType: (type) => setP((cur) => ({ ...cur, type })),
    tweenP,
    playSeq,
    wiggle,
    playing,
    ...practiceCtx,
  };

  const isPractice = step.id === 'practice';
  const overlay = (
    <div className="viewport-tools">
      <button type="button" className={`tool${showLabels ? ' on' : ''}`} onClick={() => setShowLabels((v) => !v)} aria-pressed={showLabels}>
        <Icon name="tag" size={14} /> <span className="tool-text">Labels</span>
      </button>
      {!isPractice && (
        <button type="button" className={`tool${showGhosts ? ' on' : ''}`} onClick={() => setShowGhosts((v) => !v)} aria-pressed={showGhosts}>
          <Icon name="layers" size={14} /> <span className="tool-text">Intermediate frames</span>
        </button>
      )}
      <button type="button" className="tool" onClick={() => setViewKey((k) => k + 1)}>
        <Icon name="reset" size={14} /> <span className="tool-text">Reset view</span>
      </button>
    </div>
  );

  return (
    <div className="learn" hidden={!active}>
      <nav className="stepper" aria-label="Lesson steps">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`step-chip${i === stepIdx ? ' current' : ''}${i < stepIdx ? ' done' : ''}`}
            onClick={() => goTo(i)}
            aria-current={i === stepIdx ? 'step' : undefined}
          >
            <span className="num" style={s.color ? { '--c': s.color } : undefined}>
              {i + 1}
            </span>
            <span className="lbl">{s.short}</span>
          </button>
        ))}
      </nav>

      <div className="learn-grid">
        <section className="panel step-panel" aria-live="polite">
          <div className="step-kicker">
            Step {stepIdx + 1} of {STEPS.length}
          </div>
          <h2>{step.title}</h2>
          <div className="step-body">{step.render(ctx)}</div>
          <div className="step-nav">
            <button type="button" className="btn" onClick={() => goTo(stepIdx - 1)} disabled={stepIdx === 0}>
              <Icon name="left" size={15} /> Back
            </button>
            <span className="step-nav-hint">← → keys work too</span>
            <button
              type="button"
              className="btn primary"
              onClick={() => goTo(stepIdx + 1)}
              disabled={stepIdx === STEPS.length - 1}
            >
              Next <Icon name="right" size={15} />
            </button>
          </div>
        </section>

        <section className="stage">
          <Viewport
            active={active}
            cameraPosition={CAMERA.position}
            target={CAMERA.target}
            resetKey={viewKey}
            grid={{ size: 4, divisions: 20, z: 0 }}
            overlay={overlay}
          >
            {isPractice ? (
              <JointScene
                p={practice.user}
                progress={4}
                focus="all"
                showGhosts={false}
                showLabels={showLabels}
                target={linkStd(practice.target)}
              />
            ) : (
              <JointScene
                p={p}
                progress={progress}
                focus={step.focus}
                showGhosts={showGhosts}
                showLabels={showLabels}
              />
            )}
          </Viewport>
          {!isPractice && (
            <SequenceBar
              progress={progress}
              onScrub={(v) => {
                stop();
                setProgress(v);
              }}
              playing={playing}
              onPlay={() => (step.seq ? playSeq(step.seq[0], step.seq[1]) : playSeq(0, 4))}
              onStop={stop}
              activeKey={step.focus}
            />
          )}
        </section>
      </div>
    </div>
  );
}
