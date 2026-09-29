import { Icon } from '../components/Icons.jsx';
import { Tex } from '../components/Tex.jsx';
import { NumberField, Segmented } from '../components/ui.jsx';
import { PARAM_COLORS } from '../lib/colors.js';
import { formatInput } from '../lib/format.js';

const t = String.raw;

const COLS = {
  theta: { tex: t`\theta_j`, kind: 'angle' },
  d: { tex: 'd_j', kind: 'length' },
  a: { tex: 'a_j', kind: 'length' },
  alpha: { tex: t`\alpha_j`, kind: 'angle' },
};

// Same column order the Robotics Toolbox prints.
const ORDER = ['theta', 'd', 'a', 'alpha'];

const isVariable = (j, k) => (j.type === 'R' && k === 'theta') || (j.type === 'P' && k === 'd');

/**
 * readOnly: plain values (a given table). lockRows: rows can't be moved or removed.
 * hideLimits: leave out the q min / q max columns (compact table).
 */
export function JointTable({ robot, onChange, onType, onMove, onRemove, readOnly = false, lockRows = false, hideLimits = false }) {
  const { joints, units } = robot;
  const order = ORDER;
  const angUnit = units === 'deg' ? 'deg' : 'rad';
  const actions = !readOnly && !lockRows;
  const field = (value, kind, ariaLabel, onValue) =>
    readOnly ? (
      <span className="ro-val">{formatInput(value, kind, units)}</span>
    ) : (
      <NumberField value={value} kind={kind} units={units} ariaLabel={ariaLabel} onChange={onValue} />
    );

  return (
    <div className="table-wrap">
      <table className={`joint-table${hideLimits ? ' compact' : ''}${readOnly ? ' readonly' : ''}`}>
        <thead>
          <tr>
            <th className="c-idx">j</th>
            <th>Type</th>
            {order.map((k) => (
              <th key={k} className="c-param" style={{ '--c': PARAM_COLORS[k] }}>
                <Tex>{t`\textcolor{${PARAM_COLORS[k]}}{${COLS[k].tex}}`}</Tex>
                <span className="unit">{COLS[k].kind === 'angle' ? angUnit : 'm'}</span>
              </th>
            ))}
            <th>
              offset <span className="unit">{angUnit} / m</span>
            </th>
            {!hideLimits && (
              <>
                <th>
                  q min <span className="unit">{angUnit} / m</span>
                </th>
                <th>
                  q max <span className="unit">{angUnit} / m</span>
                </th>
              </>
            )}
            {actions && (
              <th className="c-actions">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {joints.map((j, i) => {
            const qKind = j.type === 'R' ? 'angle' : 'length';
            return (
              <tr key={j.id}>
                <td className="c-idx">{i + 1}</td>
                <td>
                  {readOnly ? (
                    <span className="ro-type">{j.type}</span>
                  ) : (
                    <Segmented
                      size="sm"
                      value={j.type}
                      onChange={(type) => onType(j.id, type)}
                      ariaLabel={`Joint ${i + 1} type`}
                      options={[
                        { value: 'R', label: 'R', title: 'Revolute: theta is the joint variable' },
                        { value: 'P', label: 'P', title: 'Prismatic: d is the joint variable' },
                      ]}
                    />
                  )}
                </td>
                {order.map((k) => (
                  <td key={k}>
                    {isVariable(j, k) ? (
                      <span className="var-chip" style={{ '--c': PARAM_COLORS[k] }} title="Joint variable">
                        q<sub>{i + 1}</sub>
                      </span>
                    ) : (
                      field(j[k], COLS[k].kind, `Joint ${i + 1} ${k}`, (v) => onChange(j.id, { [k]: v }))
                    )}
                  </td>
                ))}
                <td>{field(j.offset, qKind, `Joint ${i + 1} offset`, (v) => onChange(j.id, { offset: v }))}</td>
                {!hideLimits && (
                  <>
                    <td>{field(j.qlim[0], qKind, `Joint ${i + 1} lower limit`, (v) => onChange(j.id, { qlim: [v, j.qlim[1]] }))}</td>
                    <td>{field(j.qlim[1], qKind, `Joint ${i + 1} upper limit`, (v) => onChange(j.id, { qlim: [j.qlim[0], v] }))}</td>
                  </>
                )}
                {actions && (
                  <td className="c-actions">
                    <button type="button" className="icon-btn sm" onClick={() => onMove(j.id, -1)} disabled={i === 0} aria-label={`Move joint ${i + 1} up`} title="Move up">
                      <Icon name="up" size={14} />
                    </button>
                    <button type="button" className="icon-btn sm" onClick={() => onMove(j.id, 1)} disabled={i === joints.length - 1} aria-label={`Move joint ${i + 1} down`} title="Move down">
                      <Icon name="down" size={14} />
                    </button>
                    <button type="button" className="icon-btn sm danger" onClick={() => onRemove(j.id)} disabled={joints.length === 1} aria-label={`Remove joint ${i + 1}`} title="Remove">
                      <Icon name="trash" size={14} />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
