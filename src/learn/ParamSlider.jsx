import { Tex } from '../components/Tex.jsx';
import { PARAM_COLORS } from '../lib/colors.js';
import { toDeg, toRad } from '../lib/dh.js';
import { fmtNum } from '../lib/format.js';
import { t } from './symbols.js';

export const PARAM_META = {
  theta: { sym: t`\theta_j`, name: 'joint angle', angle: true, min: -180, max: 180, step: 1 },
  d: { sym: 'd_j', name: 'link offset', min: -0.8, max: 1.4, step: 0.01 },
  a: { sym: 'a_j', name: 'link length', min: 0, max: 1.4, step: 0.01 },
  alpha: { sym: t`\alpha_j`, name: 'link twist', angle: true, min: -180, max: 180, step: 1 },
};

/** Slider for one DH parameter. Angles are stored in radians, shown in degrees. */
export function ParamSlider({ param, value, onChange, min, max, step, variable = false, sym, name }) {
  const m = PARAM_META[param];
  const shown = m.angle ? toDeg(value) : value;
  return (
    <div className="pslider" style={{ '--c': PARAM_COLORS[param] }}>
      <div className="pslider-head">
        <span className="pslider-sym">
          <Tex>{sym ?? m.sym}</Tex>
        </span>
        <span className="pslider-name">{name ?? m.name}</span>
        {variable && <span className="var-badge">joint variable</span>}
        <span className="pslider-val">{m.angle ? `${fmtNum(shown, 0)}°` : `${fmtNum(shown, 2)} m`}</span>
      </div>
      <input
        type="range"
        min={min ?? m.min}
        max={max ?? m.max}
        step={step ?? m.step}
        value={shown}
        aria-label={`${m.name} (${m.angle ? 'degrees' : 'metres'})`}
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange(m.angle ? toRad(v) : v);
        }}
      />
    </div>
  );
}
