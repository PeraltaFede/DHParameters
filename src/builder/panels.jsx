// Panels shared by the Build and Practice views.
import { Icon } from '../components/Icons.jsx';
import { Tex } from '../components/Tex.jsx';
import { NumberField } from '../components/ui.jsx';
import { JOINT_COLORS } from '../lib/colors.js';
import { clamp, pos, toDeg, toRad } from '../lib/dh.js';
import { angleLabel, fmtNum, matTex } from '../lib/format.js';

/**
 * One slider per joint coordinate, within qlim. onQ(id, value, index).
 * typed: show an input for exact values instead of a read-out. onZero: optional reset button.
 */
export function JointSliders({ joints, units, onQ, onZero, zeroLabel = 'Zero pose', typed = false, disabled = false }) {
  return (
    <div className={`qsliders${disabled ? ' disabled' : ''}`}>
      {joints.map((j, i) => {
        const [lo, hi] = j.qlim;
        const valid = lo < hi;
        const R = j.type === 'R';
        // Revolute sliders move in whole degrees (or fine radians); prismatic in mm.
        const toUi = (v) => (R && units === 'deg' ? toDeg(v) : v);
        const fromUi = (v) => (R && units === 'deg' ? toRad(v) : v);
        return (
          <div key={j.id} className="qslider" style={{ '--c': JOINT_COLORS[j.type] }}>
            <span className="qtag">
              q<sub>{i + 1}</sub>
            </span>
            <input
              type="range"
              min={toUi(lo)}
              max={toUi(hi)}
              step={R ? (units === 'deg' ? 1 : 0.005) : 0.001}
              value={toUi(clamp(j.q, lo, hi))}
              disabled={!valid || disabled}
              onChange={(e) => onQ(j.id, fromUi(Number(e.target.value)), i)}
              aria-label={`Joint ${i + 1} coordinate`}
            />
            {typed ? (
              <span className="qinput">
                <NumberField
                  value={j.q}
                  kind={R ? 'angle' : 'length'}
                  units={units}
                  ariaLabel={`Joint ${i + 1} value`}
                  onChange={(v) => !disabled && valid && onQ(j.id, clamp(v, lo, hi), i)}
                />
                <span className="qunit">{R ? (units === 'deg' ? '°' : 'rad') : 'm'}</span>
              </span>
            ) : (
              <span className="qval">{R ? angleLabel(j.q, units, 0) : `${fmtNum(j.q, 3)} m`}</span>
            )}
          </div>
        );
      })}
      {onZero && (
        <div className="qsliders-foot">
          <button type="button" className="btn sm" onClick={onZero} disabled={disabled}>
            <Icon name="zero" size={14} /> {zeroLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export function PosePanel({ T, n, title = 'End-effector pose' }) {
  const [x, y, z] = pos(T);
  return (
    <div className="pose">
      <div className="pose-head">
        <span>
          {title} <Tex>{`{}^{0}T_{${n}}`}</Tex>
        </span>
        <span className="pose-xyz">
          x {fmtNum(x, 3)} · y {fmtNum(y, 3)} · z {fmtNum(z, 3)} m
        </span>
      </div>
      <Tex block>{matTex(T, 3)}</Tex>
    </div>
  );
}
