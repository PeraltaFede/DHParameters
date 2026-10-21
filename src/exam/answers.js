// Reading what the student typed in Exercise 2 (frame origins, robot links) so it can be drawn,
// without judging it. Numbers may use a decimal comma; whatever isn't a number is left out.
import { add, scale } from '../lib/dh.js';
import { DIRS } from '../lib/examRobot.js';
import { parseExpr } from '../lib/format.js';

/** A typed number: "0,35", "0.35", "-0.2" or "pi/2". NaN when empty or not a number. */
export const readNum = (text) => parseExpr(String(text ?? '').replace(/,/g, '.')).value;

/** Is this typed text something other than a number (empty counts as fine)? */
export const notANumber = (text) => String(text ?? '').trim() !== '' && Number.isNaN(readNum(text));

/** A frame's origin as [x, y, z], or null while a coordinate is missing or not a number. */
export function frameOrigin(frame) {
  const o = frame.o.map(readNum);
  return o.every(Number.isFinite) ? o : null;
}

/**
 * The robot from the chain the student typed: joint 1 at the origin, each next joint where the
 * previous link ends, and the tip where link 3 ends. Segments with no direction or no valid
 * length are skipped.
 */
export function chainGeometry(robot) {
  let at = [0, 0, 0];
  const joints = [];
  const segs = [];
  robot.forEach((joint, k) => {
    joints.push({ at, axis: joint.axis ? DIRS[joint.axis] : null });
    for (const sg of joint.links) {
      const len = readNum(sg.len);
      if (!sg.dir || !Number.isFinite(len) || Math.abs(len) < 1e-9) continue;
      const to = add(at, scale(DIRS[sg.dir], len));
      segs.push({ from: at, to, len, link: k });
      at = to;
    }
  });
  return { joints, segs, tip: at };
}
