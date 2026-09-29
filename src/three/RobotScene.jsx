// Stick-figure robot in the style of the Robotics Toolbox plot: joints as
// cylinders (revolute) or sleeves (prismatic) on their axes, links along the
// DH path (d along z, a along x), and a frame at every link.
import { JOINT_COLORS } from '../lib/colors.js';
import { add, axis, jointParams, norm, pos, scale, sub } from '../lib/dh.js';
import { useScenePalette } from '../theme.js';
import { Frame, JointBody, Label, Rod } from './primitives.jsx';

export { robotScale } from '../lib/dh.js';

/** Floor grid under the pedestal, sized to the robot. */
export function gridFor(s) {
  const size = Math.max(2, Math.ceil(s * 2.5));
  return { size, divisions: Math.max(10, size * 5), z: -0.115 * s };
}

/** Camera pose that frames the robot. */
export function fitView(frames, s) {
  const pts = frames.map(pos);
  const lo = [0, 1, 2].map((i) => Math.min(...pts.map((p) => p[i])));
  const hi = [0, 1, 2].map((i) => Math.max(...pts.map((p) => p[i])));
  const c = scale(add(lo, hi), 0.5);
  const span = Math.max(norm(sub(hi, lo)), s * 0.6, 0.6);
  const target = [c[0], c[1], Math.max(c[2], 0)];
  const dist = span * 1.75 + 0.25 * s + 0.4; // room for the frame arrows too
  const dir = [0.62, -0.68, 0.4];
  return { target, position: add(target, scale(dir, dist / norm(dir))) };
}

/**
 * Link segments and joint placement of joint i (1-based j = i + 1), standard DH:
 * joint j turns about z_{j-1} at O_{j-1}; the path is d along z_{j-1}, then a along x_j.
 */
export function linkGeometry(frames, joints, i) {
  const p = jointParams(joints[i]);
  const Tprev = frames[i];
  const from = pos(Tprev);
  const to = pos(frames[i + 1]);
  const mid = add(from, scale(axis(Tprev, 2), p.d));
  return { jointAt: from, jointDir: axis(Tprev, 2), dSeg: [from, mid], aSeg: [mid, to] };
}

/**
 * ghost: draw the whole robot see-through in the accent colour (a student's model laid over a drawing).
 * frameSet: 'all' frames, or only the base and tool frames ('ends').
 */
export function RobotScene({ joints, frames, s, showFrames = true, showLabels = true, ghost = false, frameSet = 'all' }) {
  const pal = useScenePalette();
  const jr = 0.045 * s;
  const jl = 0.15 * s;
  const rr = 0.017 * s;
  const fs = 0.16 * s;
  const last = frames.length - 1;
  const shown = (k) => frameSet === 'all' || k === 0 || k === last;
  const tint = (color) => (ghost ? pal.accent : color);

  // Frames that share an origin get one label: {4,5,6}
  const groups = [];
  frames.forEach((T, k) => {
    if (!shown(k)) return;
    const o = pos(T);
    const g = groups.find((gr) => norm(sub(gr.o, o)) < 1e-3 * s);
    if (g) g.ids.push(k);
    else groups.push({ o, ids: [k], T });
  });

  return (
    <group>
      {/* pedestal under the base frame */}
      {!ghost && (
        <mesh position={[0, 0, -jl / 2 - 0.02 * s]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[jr * 2.4, jr * 2.8, 0.04 * s, 40]} />
          <meshStandardMaterial color={pal.base} roughness={0.7} />
        </mesh>
      )}

      {joints.map((j, i) => {
        const g = linkGeometry(frames, joints, i);
        const prismatic = j.type === 'P';
        return (
          <group key={j.id}>
            <Rod from={g.dSeg[0]} to={g.dSeg[1]} radius={prismatic ? rr * 1.3 : rr} color={tint(prismatic ? JOINT_COLORS.P : pal.rod)} square={prismatic} opacity={ghost ? 0.4 : prismatic ? 0.85 : 1} />
            <Rod from={g.aSeg[0]} to={g.aSeg[1]} radius={rr} color={tint(pal.rod)} opacity={ghost ? 0.4 : 1} />
            <JointBody origin={g.jointAt} dir={g.jointDir} type={j.type} radius={jr} length={jl} color={tint(JOINT_COLORS[j.type])} opacity={ghost ? 0.3 : 0.92} />
          </group>
        );
      })}

      {showFrames &&
        frames.map((T, k) =>
          shown(k) ? (
            <Frame
              key={k}
              T={T}
              size={k === last ? fs * 1.35 : fs}
              radius={0.0075 * s}
              opacity={ghost ? 0.6 : k === 0 || k === last ? 1 : 0.85}
            />
          ) : null,
        )}

      {showLabels &&
        groups.map((g) => {
          const T = g.T;
          const off = scale(add(add(axis(T, 0), axis(T, 1)), axis(T, 2)), -0.07 * s);
          const isEnd = g.ids.includes(frames.length - 1);
          return (
            <Label key={g.ids.join(',')} position={add(g.o, off)} className={ghost ? 'ghost' : isEnd ? 'end' : ''}>
              {`{${g.ids.join(',')}}`}
            </Label>
          );
        })}
    </group>
  );
}
