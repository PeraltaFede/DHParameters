// Reference drawing for the modelling exercises: the robot's links and joints at q_ref with
// dimensions, joint numbers and each joint's positive direction. No DH frames are shown
// except the given base frame {0} and tool frame {n}; placing the rest is the exercise.
import { JOINT_COLORS } from '../lib/colors.js';
import { add, cross, jointParams, norm, normalize, scale, sub, toRad } from '../lib/dh.js';
import { fmtNum } from '../lib/format.js';
import { useScenePalette } from '../theme.js';
import { AngleArc, Arrow, DashedLine, Frame, JointBody, Label, Rod } from './primitives.jsx';
import { linkGeometry } from './RobotScene.jsx';

/** A unit vector perpendicular to u. */
function perpendicular(u) {
  return normalize(cross(u, Math.abs(u[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]));
}

const mid = ([a, b]) => scale(add(a, b), 0.5);
const axisLabels = (k) =>
  ['x', 'y', 'z'].map((c) => (
    <>
      {c}
      <sub>{k}</sub>
    </>
  ));

export function RobotDrawing({ joints, frames, s, showLabels = true }) {
  const pal = useScenePalette();
  const jr = 0.045 * s;
  const jl = 0.15 * s;
  const rr = 0.017 * s;
  const fs = 0.16 * s;
  const n = joints.length;

  return (
    <group>
      <mesh position={[0, 0, -jl / 2 - 0.02 * s]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[jr * 2.4, jr * 2.8, 0.04 * s, 40]} />
        <meshStandardMaterial color={pal.base} roughness={0.7} />
      </mesh>

      {joints.map((j, i) => {
        const g = linkGeometry(frames, joints, i);
        const u = normalize(g.jointDir);
        const w = perpendicular(u);
        const R = j.type === 'R';
        const dLen = norm(sub(g.dSeg[1], g.dSeg[0]));
        const aLen = norm(sub(g.aSeg[1], g.aSeg[0]));
        return (
          <group key={j.id}>
            <Rod from={g.dSeg[0]} to={g.dSeg[1]} radius={R ? rr : rr * 1.3} color={R ? pal.rod : JOINT_COLORS.P} square={!R} opacity={R ? 1 : 0.85} />
            <Rod from={g.aSeg[0]} to={g.aSeg[1]} radius={rr} color={pal.rod} />
            <JointBody origin={g.jointAt} dir={u} type={j.type} radius={jr} length={jl} color={JOINT_COLORS[j.type]} opacity={0.92} />

            {/* joint axis, and the direction in which q grows */}
            <DashedLine from={add(g.jointAt, scale(u, -jl * 1.3))} to={add(g.jointAt, scale(u, jl * 1.9))} color={pal.axisLine} opacity={0.85} />
            {R ? (
              <AngleArc center={add(g.jointAt, scale(u, jl * 0.5 + 0.015 * s))} from={w} axis={u} angle={toRad(270)} radius={jr * 1.75} color={JOINT_COLORS.R} width={2.5} />
            ) : (
              <Arrow from={add(g.jointAt, scale(w, jr * 2))} dir={u} length={jl * 1.3} radius={0.006 * s} color={JOINT_COLORS.P} />
            )}

            {showLabels && (
              <Label position={add(g.jointAt, add(scale(w, -jr * 2.8), scale(u, -jl * 0.3)))} className="joint-num">
                {i + 1}
              </Label>
            )}
            {showLabels && dLen > 1e-6 && (
              <Label position={add(mid(g.dSeg), scale(w, jr * 1.6))} className="dim">
                {R ? (
                  fmtNum(dLen, 3)
                ) : (
                  <>
                    q<sub>{i + 1}</sub> = {fmtNum(jointParams(j).d, 2)}
                  </>
                )}
              </Label>
            )}
            {showLabels && aLen > 1e-6 && (
              <Label position={add(mid(g.aSeg), scale(perpendicular(normalize(sub(g.aSeg[1], g.aSeg[0]))), jr * 1.4))} className="dim">
                {fmtNum(aLen, 3)}
              </Label>
            )}
          </group>
        );
      })}

      <Frame T={frames[0]} size={fs} radius={0.0075 * s} labels={showLabels ? axisLabels(0) : null} name={showLabels ? '{0}' : null} nameOffset={0.07 * s} />
      <Frame T={frames[n]} size={fs * 1.35} radius={0.009 * s} labels={showLabels ? axisLabels(n) : null} name={showLabels ? `{${n}}` : null} nameOffset={0.07 * s} />
    </group>
  );
}
