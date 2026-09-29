// Practice exercises on whole robots, in three levels:
//   1 Reach: the DH table is given, find q that reaches a target pose.
//   2 Model: write the DH table of a drawn robot.
//   3 Model + reach: model it, then reach a target with it.
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../components/Icons.jsx';
import { M } from '../../components/Tex.jsx';
import { Callout, Segmented } from '../../components/ui.jsx';
import { fkine, withQ } from '../../lib/dh.js';
import { checkModel, checkReach, degStr, LEVELS, mm, modelHint, qText, reachHint, TEMPLATES } from '../../lib/exercises.js';
import { Frame } from '../../three/primitives.jsx';
import { RobotDrawing } from '../../three/RobotDrawing.jsx';
import { fitView, gridFor, RobotScene } from '../../three/RobotScene.jsx';
import { Viewport } from '../../three/Viewport.jsx';
import { CodePanel } from '../CodePanel.jsx';
import { JointTable } from '../JointTable.jsx';
import { JointSliders, PosePanel } from '../panels.jsx';
import { tableStamp, usePracticeState } from './usePracticeState.js';

const shortLabel = (label) => label.replace(/\s*\(.*\)$/, '');

function Mark({ ok }) {
  return (
    <span className={`mark ${ok ? 'ok' : 'bad'}`} aria-label={ok ? 'correct' : 'wrong'}>
      {ok ? <Icon name="check" size={13} /> : '✗'}
    </span>
  );
}

function Checklist({ result, n, stale }) {
  const count = result.items.find((i) => i.kind === 'count');
  const tool = result.items.find((i) => i.kind === 'tool');
  return (
    <div className={`checklist${stale ? ' stale' : ''}`}>
      {stale && <div className="checklist-note">The table has changed since this check. Check it again.</div>}
      {count ? (
        <div className="check-line">
          <Mark ok={false} /> The table needs {n} rows.
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Joint</th>
              <th>Type</th>
              <th>Axis (position and direction)</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: n }, (_, k) => {
              const type = result.items.find((i) => i.key === `type${k + 1}`);
              const ax = result.items.find((i) => i.key === `axis${k + 1}`);
              return (
                <tr key={k}>
                  <td>{k + 1}</td>
                  <td>
                    <Mark ok={type.ok} />
                  </td>
                  <td>
                    <Mark ok={ax.ok} />
                    {!ax.ok && <span className="check-detail">{ax.angle > 0.01 ? `${degStr(ax.angle)} off` : `${mm(ax.dist)} away`}</span>}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td colSpan={2}>Tool frame {`{${n}}`}</td>
              <td>
                <Mark ok={tool.ok} />
                {!tool.ok && (
                  <span className="check-detail">
                    {mm(tool.dp)} · {degStr(tool.dr)} off
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function PracticeView({ active, onOpenInBuild }) {
  const [state, progress, act] = usePracticeState();
  const { level, exercise: ex, student, units } = state;
  const [viewKey, setViewKey] = useState(0);
  const [showLabels, setShowLabels] = useState(true);
  const [showMine, setShowMine] = useState(true);

  const n = ex.truth.length;
  const s = ex.s;
  const modelLevel = level >= 2;
  const stale = Boolean(state.lastCheck) && state.lastCheck.stamp !== tableStamp(student.joints);
  const modelOk = !modelLevel || Boolean(state.lastCheck && !stale && state.lastCheck.result.ok);
  const reachPhase = level === 1 || (level === 3 && modelOk);

  const reach = useMemo(() => (reachPhase ? checkReach(ex, student.joints, student.q) : null), [reachPhase, ex, student]);
  const done = level === 2 ? modelOk : Boolean(reach?.ok);

  // Count a solve once, when it happens (markSolved ignores repeats and revealed answers).
  useEffect(() => {
    if (done && !state.solved) act.markSolved();
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  // In level 3, hints switch from the table to the joint values once the model passes.
  useEffect(() => {
    if (level === 3 && modelOk) act.resetHints();
  }, [level, modelOk]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------------------------------------ geometry */
  const truthAtRef = useMemo(() => withQ(ex.truth, ex.qRef), [ex]);
  const refFrames = useMemo(() => fkine(truthAtRef), [truthAtRef]);
  const view = fitView(refFrames, s); // applied when the exercise or viewKey changes
  const mineAtRef = useMemo(() => withQ(student.joints, ex.qRef), [student.joints, ex.qRef]);
  const mineRefFrames = useMemo(() => fkine(mineAtRef), [mineAtRef]);
  const driven = useMemo(() => withQ(student.joints, student.q), [student]);
  const drivenFrames = useMemo(() => fkine(driven), [driven]);
  // Sliders follow the real joints (types and given limits).
  const sliderJoints = ex.truth.map((t, i) => ({ ...t, q: student.q[i] }));

  const targetFrame = (
    <Frame T={ex.target} size={0.16 * s * 1.7} radius={0.011 * s} opacity={0.5} name={showLabels ? 'target' : null} nameOffset={0.1 * s} />
  );
  const scene = reachPhase ? (
    <>
      <RobotScene joints={driven} frames={drivenFrames} s={s} frameSet="ends" showLabels={showLabels} />
      {targetFrame}
    </>
  ) : (
    <>
      <RobotDrawing joints={truthAtRef} frames={refFrames} s={s} showLabels={showLabels} />
      {showMine && <RobotScene joints={mineAtRef} frames={mineRefFrames} s={s} ghost showLabels={showLabels} />}
      {level === 3 && targetFrame}
    </>
  );

  const overlay = (
    <div className="viewport-tools">
      {!reachPhase && (
        <button type="button" className={`tool${showMine ? ' on' : ''}`} onClick={() => setShowMine((v) => !v)} aria-pressed={showMine}>
          <Icon name="layers" size={14} /> <span className="tool-text">My model</span>
        </button>
      )}
      <button type="button" className={`tool${showLabels ? ' on' : ''}`} onClick={() => setShowLabels((v) => !v)} aria-pressed={showLabels}>
        <Icon name="tag" size={14} /> <span className="tool-text">Labels</span>
      </button>
      <button type="button" className="tool" onClick={() => setViewKey((k) => k + 1)}>
        <Icon name="fit" size={14} /> <span className="tool-text">Fit view</span>
      </button>
    </div>
  );

  /* -------------------------------------------------------------- texts */
  const qRefText = ex.qRef.map((v, i) => qText(ex.truth[i], v, units)).join(', ');
  const hintText =
    state.hints === 0
      ? null
      : reachPhase
        ? reachHint(ex, state.hints, units)
        : (modelHint(ex, checkModel(ex, student.joints)) ?? 'Your table already matches the drawing: press Check model.');
  const codeRobot = {
    name: `${ex.name}_practice`,
    units,
    opts: state.opts,
    joints: withQ(student.joints, level === 2 ? ex.qRef : student.q),
  };

  const total = Object.values(progress).reduce((acc, lv) => acc + Object.values(lv ?? {}).reduce((x, y) => x + y, 0), 0);
  const levelDone = progress[level] ?? {};

  return (
    <div className="practice" hidden={!active}>
      <section className="panel toolbar practice-bar">
        <div className="field">
          <span>Level</span>
          <Segmented
            value={level}
            onChange={(l) => act.newExercise(l, state.templateId)}
            ariaLabel="Level"
            options={LEVELS.map((l) => ({ value: l.id, label: `${l.id} · ${l.short}`, title: l.label }))}
          />
        </div>
        <label className="field">
          <span>Robot</span>
          <select value={state.templateId} onChange={(e) => act.newExercise(level, e.target.value)}>
            <option value="random">Random{level !== 2 ? ' (up to 4 axes)' : ''}</option>
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <div className="field">
          <span>Angles in</span>
          <Segmented
            value={units}
            onChange={act.setUnits}
            ariaLabel="Angle units"
            options={[
              { value: 'deg', label: 'degrees' },
              { value: 'rad', label: 'radians' },
            ]}
          />
        </div>
        <button type="button" className="btn primary" onClick={() => act.newExercise()}>
          <Icon name="shuffle" size={15} /> New exercise
        </button>
        <div className="progress" aria-label="Your progress">
          <div className="progress-total">
            Solved <b>{total}</b> · level {level}:
          </div>
          <div className="progress-chips" title={`Robots solved at level ${level}`}>
            {TEMPLATES.map((t) => (
              <span key={t.id} className={`pchip${levelDone[t.id] ? ' done' : ''}`}>
                {levelDone[t.id] ? '✓ ' : ''}
                {shortLabel(t.label)}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="practice-grid">
        <section className="stage practice-stage">
          <div className="panel viewer-panel">
            <Viewport
              active={active}
              cameraPosition={view.position}
              target={view.target}
              resetKey={`${ex.id}:${viewKey}`}
              grid={gridFor(s)}
              overlay={overlay}
            >
              {scene}
            </Viewport>
            {level === 2 ? (
              <p className="hint">
                Drawn at q = ({qRefText}). Dimensions in metres.
              </p>
            ) : (
              <>
                {level === 3 && !modelOk && <p className="hint">The joint values unlock once your model is right.</p>}
                <JointSliders
                  joints={sliderJoints}
                  units={units}
                  typed
                  disabled={!reachPhase}
                  onQ={(id, v, i) => act.setQ(i, v)}
                  onZero={act.resetQ}
                  zeroLabel="Back to start"
                />
                {reach && (
                  <div className={`reach${reach.ok ? ' ok' : ''}`}>
                    {reach.ok ? <Icon name="check" size={15} /> : <Icon name="fit" size={15} />}
                    Distance to target: <b>{mm(reach.dp)}</b> · <b>{degStr(reach.dr)}</b>
                  </div>
                )}
                {reachPhase && <PosePanel T={drivenFrames[n]} n={n} title="Your pose" />}
              </>
            )}
          </div>
        </section>

        <section className="panel practice-panel">
          <div className="practice-head">
            <span className="level-badge">Level {level}</span>
            <h3>
              {LEVELS[level - 1].label} <span className="muted">· {ex.label}</span>
            </h3>
          </div>

          <div className="practice-body">
            {level === 1 && (
              <p>
                This robot's DH table is given. Find joint values <M>q</M> that put the end-effector frame{' '}
                <M>{`\\{${n}\\}`}</M> exactly on the faded <b>target</b> frame. Use the sliders under the 3D view or type
                exact values; any solution that reaches the pose counts.
              </p>
            )}
            {modelLevel && (
              <>
                <p>
                  Write the <b>standard DH table</b> of the robot in the drawing. It is shown at <b>q = ({qRefText})</b>.
                  Arrows mark each joint's positive direction. The base frame <M>{'\\{0\\}'}</M> and the tool frame{' '}
                  <M>{`\\{${n}\\}`}</M> are given, and dimensions are in metres.
                </p>
                <p className="note">
                  Your table must reproduce the drawing at those joint values, with each joint axis pointing along its
                  arrow. Use the offset column if your θ = 0 differs from the drawing. The blue ghost in the 3D view is
                  your model.
                  {level === 3 && ' Once the model is right, the joint sliders unlock: then reach the faded target frame.'}
                </p>
              </>
            )}
            {level !== 2 && ex.axes >= 5 && (
              <Callout title="Tip for 6-axis robots">
                Let the toolbox do the inverse kinematics: build the robot in MATLAB with the code below and run{' '}
                <code>q = robot.ikine(T)</code>, with <code>T</code> the target pose. Then type q here.
              </Callout>
            )}
            {level !== 2 && <PosePanel T={ex.target} n={n} title="Target pose" />}

            <div className="practice-table">
              <div className="practice-table-head">
                <h4>{level === 1 ? 'Given DH table' : 'Your DH table'}</h4>
                {modelLevel && (
                  <button type="button" className="btn sm primary" onClick={act.check}>
                    <Icon name="check" size={14} /> Check model
                  </button>
                )}
              </div>
              <JointTable
                robot={{ joints: student.joints, units }}
                readOnly={level === 1}
                lockRows
                hideLimits={modelLevel}
                onChange={act.updateJoint}
                onType={act.changeType}
              />
              {modelLevel && state.lastCheck && <Checklist result={state.lastCheck.result} n={n} stale={stale} />}
            </div>

            {done ? (
              <Callout tone="ok" title={state.revealed ? 'Solution revealed (not counted)' : level === 2 ? 'Model correct!' : 'Target reached!'}>
                {level === 2
                  ? 'Your table describes this robot: for any q it moves exactly like the drawing.'
                  : 'Run the code below in MATLAB or Python: robot.fkine(q) gives the target pose.'}
                <div className="actions">
                  <button type="button" className="btn sm primary" onClick={() => act.newExercise()}>
                    <Icon name="shuffle" size={14} /> Next exercise
                  </button>
                </div>
              </Callout>
            ) : (
              level === 3 &&
              modelOk && (
                <Callout tone="ok" title="Model correct">
                  Now reach the target: the joint sliders under the 3D view are unlocked.
                </Callout>
              )
            )}
            {!done && hintText && (
              <Callout tone="hint" title="Hint">
                {hintText}
              </Callout>
            )}

            <div className="actions">
              <button type="button" className="btn sm" onClick={act.hint} disabled={done}>
                <Icon name="bulb" size={14} /> Hint
              </button>
              <button type="button" className="btn sm" onClick={act.reveal} disabled={done}>
                <Icon name="eye" size={14} /> Reveal
              </button>
              <button type="button" className="btn sm" onClick={() => onOpenInBuild({ name: codeRobot.name, joints: codeRobot.joints })}>
                <Icon name="right" size={14} /> Open in Build
              </button>
            </div>
          </div>

          <div className="practice-code">
            <CodePanel robot={codeRobot} setOpts={act.setOpts} />
          </div>
        </section>
      </div>
    </div>
  );
}
