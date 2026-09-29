import { Icon } from '../components/Icons.jsx';
import { Tex } from '../components/Tex.jsx';
import { PARAM_COLORS } from '../lib/colors.js';
import { clamp } from '../lib/dh.js';
import { t } from './symbols.js';

const SEGMENTS = [
  { key: 'theta', tex: t`R_z(\theta_j)`, verb: 'rotate about z' },
  { key: 'd', tex: 'T_z(d_j)', verb: 'slide along z' },
  { key: 'a', tex: 'T_x(a_j)', verb: 'slide along x' },
  { key: 'alpha', tex: t`R_x(\alpha_j)`, verb: 'rotate about x' },
];

/** The link transform as a scrubbable timeline of its four elementary transforms. */
export function SequenceBar({ progress, onScrub, playing, onPlay, onStop, activeKey }) {
  // The segment being (or just) applied: progress 1.0 still reports step 1.
  const seg = clamp(Math.ceil(progress - 1e-6) - 1, 0, 3);
  const status =
    progress <= 0.001
      ? 'Moving frame at {j−1}'
      : progress >= 3.999
        ? 'Arrived at frame {j}'
        : `Step ${seg + 1}: ${SEGMENTS[seg].verb}`;
  return (
    <div className="seq panel">
      <div className="seq-top">
        <span className="seq-title">
          <Tex>{t`{}^{j-1}\!A_j =`}</Tex>
        </span>
        <span className="seq-status">{status}</span>
      </div>
      <div className="seq-row">
        <button
          type="button"
          className="icon-btn primary"
          onClick={playing ? onStop : onPlay}
          aria-label={playing ? 'Pause' : 'Play the transform sequence'}
          title={playing ? 'Pause' : 'Play'}
        >
          <Icon name={playing ? 'pause' : 'play'} size={15} />
        </button>
        <div className="seq-track">
          {SEGMENTS.map((s, i) => {
            const fill = clamp(progress - i, 0, 1);
            return (
              <div
                key={s.key}
                className={`seq-seg${activeKey === s.key ? ' active' : ''}${fill >= 1 ? ' full' : ''}`}
                style={{ '--c': PARAM_COLORS[s.key] }}
              >
                <div className="seq-fill" style={{ width: `${fill * 100}%`, opacity: fill > 0 ? 1 : 0 }} />
                <span className="seq-label">
                  <Tex>{s.tex}</Tex>
                </span>
              </div>
            );
          })}
          <input
            type="range"
            min={0}
            max={4}
            step={0.005}
            value={progress}
            aria-label="Transform sequence progress"
            onChange={(e) => onScrub(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
