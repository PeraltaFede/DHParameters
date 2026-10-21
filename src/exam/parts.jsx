// Building blocks of the Robot exam, shared by its exercises. Nothing here checks, hints or
// corrects: answers are kept exactly as typed, for the teacher to grade from screenshots.
import { Icon } from '../components/Icons.jsx';
import { Tex } from '../components/Tex.jsx';
import { Segmented } from '../components/ui.jsx';
import { AXIS_COLORS, PARAM_COLORS } from '../lib/colors.js';
import { DIR_KEYS } from '../lib/examRobot.js';
import { notANumber } from './answers.js';
import { MAX_SEGMENTS } from './examState.js';

const t = String.raw;

/** The student ID, shown on every card so that it appears in every screenshot. */
export function StudentBadge({ id, className = '' }) {
  return (
    <span className={`student-badge ${className}`}>
      <Icon name="user" size={14} /> ID {id}
    </span>
  );
}

export function ExamCard({ id, kicker, title, children }) {
  return (
    <section className="panel exam-card">
      <div className="exam-card-head">
        <div className="exam-card-title">
          {kicker && <span className="exam-kicker">{kicker}</span>}
          <h3>{title}</h3>
        </div>
        {id && <StudentBadge id={id} />}
      </div>
      <div className="exam-card-body">{children}</div>
    </section>
  );
}

const FRAME_AXES = [
  { key: 'z', color: AXIS_COLORS[2] },
  { key: 'x', color: AXIS_COLORS[0] },
];
const DIR_OPTIONS = DIR_KEYS.map((d) => ({ value: d, label: d.replace('-', '−') }));

/** Six world directions; clicking the chosen one again clears it. */
function DirPicker({ value, onChange, ariaLabel }) {
  return <Segmented size="sm" value={value} onChange={(d) => onChange(d === value ? null : d)} ariaLabel={ariaLabel} options={DIR_OPTIONS} />;
}

/** A number typed as text ("0,35", "0.35"...), kept exactly as typed. Only marks text that isn't a number. */
export function ExamNumber({ value, onChange, ariaLabel }) {
  return (
    <input
      className={`exam-num${notANumber(value) ? ' invalid' : ''}`}
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      autoComplete="off"
      aria-label={ariaLabel}
    />
  );
}

/**
 * z and x direction of each frame, as world directions. onOrigin: also ask for each origin as
 * world coordinates (frames then carry o: [x, y, z] as typed).
 */
export function FramePicker({ frames, onChange, onOrigin }) {
  return (
    <div className="frame-picker">
      {frames.map((f, k) => {
        const name = (
          <span className="fp-name">
            <Tex>{t`\{${k}\}`}</Tex>
          </span>
        );
        const axes = FRAME_AXES.map((a) => (
          <div key={a.key} className="fp-group" style={{ '--c': a.color }}>
            <span className="fp-axis">
              {a.key}
              <sub>{k}</sub>
            </span>
            <DirPicker value={f[a.key]} onChange={(d) => onChange(k, a.key, d)} ariaLabel={`Frame ${k}, ${a.key} axis`} />
          </div>
        ));
        if (!onOrigin) {
          return (
            <div key={k} className="fp-row">
              {name}
              {axes}
            </div>
          );
        }
        return (
          <div key={k} className="fp-row fp-row-origin">
            {name}
            <div className="fp-body">
              <div className="fp-origin">
                <span className="fp-label">origin</span>
                {['X', 'Y', 'Z'].map((c, i) => (
                  <label key={c} className="fp-coord">
                    {c}
                    <ExamNumber value={f.o[i]} onChange={(text) => onOrigin(k, i, text)} ariaLabel={`Frame ${k} origin ${c}`} />
                  </label>
                ))}
                <span className="fp-label">m</span>
              </div>
              <div className="fp-axes">{axes}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The robot as a chain from its base: each joint's axis, then the link to the next joint (or to
 * the tip) as straight segments, each a direction and a length.
 */
export function ChainEditor({ robot, actions }) {
  return (
    <div className="chain-editor">
      {robot.map((joint, j) => (
        <div key={j} className="chain-joint">
          <div className="chain-row chain-axis">
            <span className="chain-name">Joint {j + 1}</span>
            <span className="chain-label">axis</span>
            <DirPicker value={joint.axis} onChange={(d) => actions.setJointAxis(j, d)} ariaLabel={`Joint ${j + 1} axis`} />
          </div>
          <div className="chain-link">
            <span className="chain-label">
              Link {j + 1} → {j < robot.length - 1 ? `joint ${j + 2}` : 'tip'}
            </span>
            {joint.links.map((sg, i) => (
              <div key={i} className="chain-row chain-seg">
                <DirPicker value={sg.dir} onChange={(dir) => actions.setSegment(j, i, { dir })} ariaLabel={`Link ${j + 1}, segment ${i + 1} direction`} />
                <ExamNumber value={sg.len} onChange={(len) => actions.setSegment(j, i, { len })} ariaLabel={`Link ${j + 1}, segment ${i + 1} length`} />
                <span className="fp-label">m</span>
                <button
                  type="button"
                  className="icon-btn sm danger"
                  onClick={() => actions.removeSegment(j, i)}
                  aria-label={`Remove segment ${i + 1} of link ${j + 1}`}
                  title="Remove segment"
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
            <button type="button" className="btn sm ghost chain-add" onClick={() => actions.addSegment(j)} disabled={joint.links.length >= MAX_SEGMENTS}>
              <Icon name="plus" size={14} /> Segment
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const COLS = [
  { key: 'sigma', tex: t`\sigma_j` },
  { key: 'theta', tex: t`\theta_j`, color: PARAM_COLORS.theta },
  { key: 'd', tex: 'd_j', color: PARAM_COLORS.d },
  { key: 'a', tex: 'a_j', color: PARAM_COLORS.a },
  { key: 'alpha', tex: t`\alpha_j`, color: PARAM_COLORS.alpha },
];

/** A DH table filled by hand: every cell is free text. */
export function AnswerTable({ rows, onChange }) {
  return (
    <div className="table-wrap">
      <table className="joint-table answer-table">
        <thead>
          <tr>
            <th className="c-idx">j</th>
            {COLS.map((c) => (
              <th key={c.key} className="c-param" style={{ '--c': c.color ?? 'var(--border-strong)' }}>
                <Tex>{c.color ? t`\textcolor{${c.color}}{${c.tex}}` : c.tex}</Tex>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="c-idx">{i + 1}</td>
              {COLS.map((c) => (
                <td key={c.key}>
                  <input
                    className="answer-input"
                    type="text"
                    value={r[c.key]}
                    onChange={(e) => onChange(i, c.key, e.target.value)}
                    spellCheck={false}
                    autoComplete="off"
                    autoCapitalize="off"
                    aria-label={`Joint ${i + 1} ${c.key}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * A plain code editor that grows with its text (so a screenshot shows all of it).
 * Tab indents with four spaces; Shift+Tab still leaves the box.
 */
export function CodeAnswer({ value, onChange, ariaLabel }) {
  return (
    <div className="code-grow" data-value={value}>
      <textarea
        className="code-answer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Tab' || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
          e.preventDefault();
          const el = e.currentTarget;
          el.setRangeText('    ', el.selectionStart, el.selectionEnd, 'end');
          onChange(el.value);
        }}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        aria-label={ariaLabel}
      />
    </div>
  );
}
