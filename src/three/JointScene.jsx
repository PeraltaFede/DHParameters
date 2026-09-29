// One link j in standard DH (RVC): frame {j-1}, frame {j}, the four parameters
// drawn as colour-coded geometry, and a "moving frame" that is carried from
// {j-1} to {j} by Rz(theta) Tz(d) Tx(a) Rx(alpha) as `progress` goes 0 -> 4.
import { PARAM_COLORS as C } from '../lib/colors.js';
import { add, axis, identity, linkStdPartial, mul, pos, Rx, Rz, scale, toRad, Tx, Tz } from '../lib/dh.js';
import { fmtNum } from '../lib/format.js';
import { useScenePalette } from '../theme.js';
import { AngleArc, Arrow, DashedLine, Dot, Frame, JointBody, Label, Rod } from './primitives.jsx';

const sub = (base, s) => (
  <>
    {base}
    <sub>{s}</sub>
  </>
);
const labelsFor = (s) => ['x', 'y', 'z'].map((c) => sub(c, s));

export function JointScene({ p, progress = 4, focus = 'all', showGhosts = true, showLabels = true, target = null }) {
  const pal = useScenePalette();

  // Frames after each elementary transform.
  const T1 = Rz(p.theta);
  const T2 = mul(T1, Tz(p.d));
  const T3 = mul(T2, Tx(p.a));
  const T4 = mul(T3, Rx(p.alpha)); // frame {j}
  const Tm = linkStdPartial(p, progress);

  const P = pos(T2); // where x_j crosses z_{j-1}
  const Oj = pos(T3);
  const x1 = axis(T1, 0); // x after Rz(theta): parallel to x_j
  const xj = axis(T4, 0);
  const zj = axis(T4, 2);

  const arrived = progress >= 3.999;
  const atStart = progress <= 0.001;

  const on = (...keys) => focus === 'all' || keys.includes(focus);
  const op = (...keys) => (on(...keys) ? 1 : 0.16);
  const arcWidth = (key) => (focus === key ? 4 : 2.5);
  const L = showLabels;

  const zLo = Math.min(0, p.d) - 0.45;
  const zHi = Math.max(0, p.d) + 0.6;
  const R = p.type === 'R';

  return (
    <group>
      {/* ---- joint j: its axis is z_{j-1} ---- */}
      <DashedLine from={[0, 0, zLo]} to={[0, 0, zHi]} color={pal.axisLine} opacity={op('axis', 'frames')} />
      {L && (
        <Label position={[0, 0, zHi + 0.07]} dim={!on('axis', 'frames')}>
          joint j axis = z<sub>j−1</sub>
        </Label>
      )}
      <JointBody
        origin={[0, 0, 0]}
        dir={[0, 0, 1]}
        type={p.type}
        radius={0.085}
        length={0.3}
        color={R ? C.theta : C.d}
        opacity={on('axis') ? 0.5 : 0.2}
      />
      {focus === 'axis' &&
        (R ? (
          <AngleArc center={[0, 0, 0.22]} from={[-1, -0.3, 0]} axis={[0, 0, 1]} angle={toRad(290)} radius={0.2} color={C.theta} width={3} />
        ) : (
          <group>
            <Arrow from={scale(x1, -0.24)} dir={[0, 0, 1]} length={0.32} radius={0.011} color={C.d} />
            <Arrow from={scale(x1, -0.24)} dir={[0, 0, -1]} length={0.32} radius={0.011} color={C.d} />
          </group>
        ))}

      {/* ---- frame {j-1}: the fixed reference ---- */}
      <Frame T={identity()} size={0.55} labels={L ? labelsFor('j−1') : null} name={L ? '{j−1}' : null} />

      {/* ---- link j drawn along the DH path: d along z_{j-1}, then a along x_j ---- */}
      <Rod from={[0, 0, 0]} to={P} radius={0.026} color={C.d} opacity={op('d') * 0.9} square={!R} />
      <Rod from={P} to={Oj} radius={0.026} color={C.a} opacity={op('a', 'frames') * 0.9} />
      <Dot position={P} radius={0.032} color={pal.neutral} opacity={on('d', 'a', 'frames') ? 1 : 0.3} />
      {L && Math.abs(p.d) > 0.04 && (
        <Label position={add(scale(P, 0.5), scale(x1, -0.2))} color={C.d} dim={!on('d')}>
          d<sub>j</sub> = {fmtNum(p.d, 2)}
        </Label>
      )}
      {L && p.a > 0.04 && (
        <Label position={add(scale(add(P, Oj), 0.5), [0, 0, -0.11])} color={C.a} dim={!on('a', 'frames')}>
          a<sub>j</sub> = {fmtNum(p.a, 2)}
        </Label>
      )}
      {L && focus === 'd' && (
        <Label position={add(P, scale(x1, -0.2))} className="small">
          x<sub>j</sub> meets z<sub>j−1</sub>
        </Label>
      )}
      {L && focus === 'frames' && p.a > 0.04 && (
        <Label position={add(scale(add(P, Oj), 0.5), [0, 0, 0.12])} className="small" color={C.a}>
          common normal
        </Label>
      )}

      {/* ---- theta: from x_{j-1} to x_j, about z_{j-1} ---- */}
      <DashedLine from={[0, 0, 0]} to={scale(x1, 0.62)} color={C.theta} opacity={op('theta')} width={2} />
      <AngleArc center={[0, 0, 0]} from={[1, 0, 0]} axis={[0, 0, 1]} angle={p.theta} radius={0.36} color={C.theta} opacity={op('theta')} width={arcWidth('theta')} />
      {L && Math.abs(p.theta) > toRad(4) && (
        <Label position={scale(axis(Rz(p.theta / 2), 0), 0.47)} color={C.theta} dim={!on('theta')}>
          θ<sub>j</sub>
        </Label>
      )}

      {/* ---- alpha: from z_{j-1} (copied to O_j) to z_j, about x_j ---- */}
      <DashedLine from={Oj} to={add(Oj, [0, 0, 0.55])} color={C.alpha} opacity={op('alpha')} width={2} />
      <AngleArc center={Oj} from={[0, 0, 1]} axis={xj} angle={p.alpha} radius={0.32} color={C.alpha} opacity={op('alpha')} width={arcWidth('alpha')} />
      {L && Math.abs(p.alpha) > toRad(4) && (
        <Label position={add(Oj, scale(axis(mul(T3, Rx(p.alpha / 2)), 2), 0.42))} color={C.alpha} dim={!on('alpha')}>
          α<sub>j</sub>
        </Label>
      )}

      {/* ---- joint j+1: its axis is z_j ---- */}
      <DashedLine from={add(Oj, scale(zj, -0.45))} to={add(Oj, scale(zj, 0.78))} color={pal.axisLine} opacity={op('alpha', 'axis', 'frames')} />
      <JointBody origin={Oj} dir={zj} type="R" radius={0.07} length={0.24} color={pal.ghost} opacity={0.16} />
      {L && (
        <Label position={add(Oj, scale(zj, 0.86))} dim={!on('alpha', 'axis', 'frames')}>
          joint j+1 axis = z<sub>j</sub>
        </Label>
      )}

      {/* ---- frame {j}: solid once the moving frame has arrived ---- */}
      <Frame T={T4} size={0.5} labels={L ? labelsFor('j') : null} name={L ? '{j}' : null} opacity={arrived ? 1 : 0.28} />

      {/* ---- intermediate frames after Rz, Tz, Tx ---- */}
      {showGhosts &&
        [T1, T2, T3].map((T, i) => <Frame key={i} T={T} size={0.28} radius={0.008} opacity={0.3} />)}

      {/* ---- the moving frame ---- */}
      {!arrived && !atStart && <Frame T={Tm} size={0.44} radius={0.017} highlight />}

      {/* ---- practice target ---- */}
      {target && <Frame T={target} size={0.62} radius={0.02} opacity={0.4} name={L ? 'target' : null} nameOffset={0.14} />}
    </group>
  );
}
