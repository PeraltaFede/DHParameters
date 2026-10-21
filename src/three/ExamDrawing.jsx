// Robot exam drawings. Exercise 1: links, joints, joint numbers and dimensions only (no DH
// frames, axes or positive directions), plus the z and x axes the student has chosen for frames
// {0}..{3}: {0}, {1}, {2} on joints 1, 2, 3 and {3} at the tip. Also the pieces Exercise 2 shares.
import { AXIS_COLORS } from '../lib/colors.js';
import { add, axis, dot, norm, normalize, scale, sub } from '../lib/dh.js';
import { DIRS } from '../lib/examRobot.js';
import { useScenePalette } from '../theme.js';
import { Arrow, Dot, Label } from './primitives.jsx';
import { DrawnLink } from './RobotDrawing.jsx';

const FRAME_AXES = [
  { key: 'z', color: AXIS_COLORS[2] },
  { key: 'x', color: AXIS_COLORS[0] },
];

export const PLATE = 0.04; // base plate thickness, times s

/** Top of the base plate: under joint 1's body, whether its axis `u` stands upright (or isn't set) or lies flat. */
export const plateTop = (u, s = 1) => (!u || Math.abs(u[2]) > 0.5 ? -0.075 * s : -0.045 * s);

/** The plate on the floor that joint 1 stands on, at the origin. */
export function BasePlate({ top, s = 1 }) {
  const pal = useScenePalette();
  const jr = 0.045 * s;
  return (
    <mesh position={[0, 0, top - (PLATE * s) / 2]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[jr * 2.4, jr * 2.8, PLATE * s, 40]} />
      <meshStandardMaterial color={pal.base} roughness={0.7} />
    </mesh>
  );
}

/** Height of Exercise 1's floor grid: under the base plate. */
export const examFloor = (robot) => plateTop(axis(robot.frames[0], 2), robot.s) - PLATE * robot.s;

const VIEW = normalize([0.62, -0.68, 0.4]); // towards the default camera (see fitView)

/**
 * Where a joint's number goes: a side across its axis u that none of the `used` directions
 * (the links leaving the joint) takes, so it can't cover a dimension. Up if possible, else the
 * side facing the default view.
 */
export function freeSide(u, used) {
  const free = Object.values(DIRS).filter((v) => Math.abs(dot(v, u)) < 0.5 && !used.some((w) => dot(v, w) > 0.5));
  const score = (v) => 2 * v[2] + dot(v, VIEW);
  return free.length ? free.reduce((best, v) => (score(v) > score(best) ? v : best)) : [0, 0, 1];
}

const same = (p, q) => norm(sub(p, q)) < 1e-9;

/** Unit directions of the segments [[a, b], ...] that start or end at point o, pointing away from o. */
export const linksAt = (o, segs) =>
  segs.filter(([a, b]) => same(a, o) || same(b, o)).map(([a, b]) => normalize(same(a, o) ? sub(b, a) : sub(a, b)));

/**
 * Frames exactly as the student set them: an origin dot and the chosen z (blue) and x (red)
 * arrows, labelled z_k / x_k. The arrows are thicker than the links so an axis along a link
 * still shows. frames: [{ o: [x, y, z] | null, z, x }]; a frame without an origin isn't drawn.
 * names: label each origin {k}. faded: see-through, as a reference under something else.
 */
export function StudentFrames({ frames, s = 1, names = false, faded = false }) {
  const pal = useScenePalette();
  const len = 0.3 * s;
  const opacity = faded ? 0.35 : 1;
  return (
    <group>
      {frames.map((f, k) => {
        const chosen = FRAME_AXES.filter((a) => f[a.key]);
        if (!f.o || (!chosen.length && !names)) return null;
        const away = chosen.reduce((acc, a) => add(acc, DIRS[f[a.key]]), [0, 0, 0]);
        const nameAt = add(f.o, scale(norm(away) > 0.5 ? normalize(away) : [0, 0, 1], -0.1 * s));
        return (
          <group key={k}>
            <Dot position={f.o} radius={0.03 * s} color={pal.neutral} opacity={opacity} />
            {chosen.map((a) => {
              const u = DIRS[f[a.key]];
              return (
                <group key={a.key}>
                  <Arrow from={f.o} dir={u} length={len} radius={0.021 * s} color={a.color} opacity={opacity} />
                  <Label position={add(f.o, scale(u, len + 0.07 * s))} color={a.color} dim={faded} plain>
                    {a.key}
                    <sub>{k}</sub>
                  </Label>
                </group>
              );
            })}
            {names && (
              <Label position={nameAt} dim={faded} className="frame-name">
                {`{${k}}`}
              </Label>
            )}
          </group>
        );
      })}
    </group>
  );
}

export function ExamDrawing({ robot, picks }) {
  const pal = useScenePalette();
  const { joints, frames, points, segs, s } = robot;

  return (
    <group>
      <BasePlate top={plateTop(axis(frames[0], 2), s)} s={s} />

      {joints.map((j, i) => (
        <DrawnLink
          key={j.id}
          frames={frames}
          joints={joints}
          i={i}
          s={s}
          marks={false}
          jointOpacity={0.5}
          numberDir={freeSide(axis(frames[i], 2), linksAt(points[i], segs))}
        />
      ))}

      {/* the tip */}
      <Dot position={points[3]} radius={0.028 * s} color={pal.neutral} />

      <StudentFrames frames={picks.map((f, k) => ({ ...f, o: points[k] }))} s={s} />
    </group>
  );
}
