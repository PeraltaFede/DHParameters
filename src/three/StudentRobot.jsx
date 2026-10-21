// Exercise 2's robot as the student built it (see chainGeometry): joint 1 on the base plate at
// the origin, each link a chain of straight segments labelled with its typed length, and each
// joint on the axis the student chose (a dot until they choose one). Nothing is corrected.
import { JOINT_COLORS } from '../lib/colors.js';
import { add, normalize, scale, sub } from '../lib/dh.js';
import { fmtNum } from '../lib/format.js';
import { useScenePalette } from '../theme.js';
import { BasePlate, freeSide, linksAt, plateTop } from './ExamDrawing.jsx';
import { Dot, JointBody, Label, Rod } from './primitives.jsx';
import { perpendicular } from './RobotDrawing.jsx';

export function StudentRobot({ geometry, s = 1 }) {
  const pal = useScenePalette();
  const jr = 0.045 * s;
  const jl = 0.15 * s;
  const rr = 0.017 * s;
  const { joints, segs, tip } = geometry;
  const pairs = segs.map((sg) => [sg.from, sg.to]);
  // A joint shows once it has an axis or a link leads to it (joint 1 always, on the base).
  const shown = (k) => k === 0 || Boolean(joints[k].axis) || segs.some((sg) => sg.link < k);

  return (
    <group>
      <BasePlate top={plateTop(joints[0].axis, s)} s={s} />

      {segs.map((sg, i) => {
        const u = normalize(sub(sg.to, sg.from));
        return (
          <group key={i}>
            <Rod from={sg.from} to={sg.to} radius={rr} color={pal.rod} />
            <Label position={add(scale(add(sg.from, sg.to), 0.5), scale(perpendicular(u), jr * 1.4))} className="dim">
              {fmtNum(Math.abs(sg.len), 3)}
            </Label>
          </group>
        );
      })}

      {joints.map((j, k) =>
        shown(k) ? (
          <group key={k}>
            {j.axis ? (
              <JointBody origin={j.at} dir={j.axis} type="R" radius={jr} length={jl} color={JOINT_COLORS.R} opacity={0.5} />
            ) : (
              <Dot position={j.at} radius={jr * 0.75} color={JOINT_COLORS.R} opacity={0.5} />
            )}
            <Label position={add(j.at, scale(freeSide(j.axis ?? [0, 0, 0], linksAt(j.at, pairs)), jr * 2.8))} className="joint-num">
              {k + 1}
            </Label>
          </group>
        ) : null,
      )}

      {/* the tip, once there is a link */}
      {segs.length > 0 && <Dot position={tip} radius={0.028 * s} color={pal.neutral} />}
    </group>
  );
}
