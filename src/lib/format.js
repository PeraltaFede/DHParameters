import { PI, toDeg, toRad } from './dh.js';

/** Fixed-point number without trailing zeros: 0.5, 90, -1.5708 */
export function fmtNum(x, digits = 4) {
  if (!Number.isFinite(x)) return 'NaN';
  let s = x.toFixed(digits);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/**
 * An angle in radians as a MATLAB/Python expression:
 * 0, pi/2, -3*pi/4, 37.5*pi/180, or plain radians as a last resort.
 */
export function angleExpr(rad) {
  if (Math.abs(rad) < 1e-10) return '0';
  const sign = rad < 0 ? '-' : '';
  const x = Math.abs(rad) / PI;
  for (const den of [1, 2, 3, 4, 6, 12]) {
    const num = Math.round(x * den);
    if (num > 0 && Math.abs(x * den - num) < 1e-7) {
      const g = gcd(num, den);
      const n = num / g, m = den / g;
      const top = n === 1 ? 'pi' : `${n}*pi`;
      return sign + (m === 1 ? top : `${top}/${m}`);
    }
  }
  const deg = toDeg(Math.abs(rad));
  if (Math.abs(deg * 100 - Math.round(deg * 100)) < 1e-6) return `${sign}${fmtNum(deg, 2)}*pi/180`;
  return fmtNum(rad, 6);
}

/** Human-readable angle: "90°" in degree mode, "π/2" or "0.6109" in radian mode. */
export function angleLabel(rad, units = 'deg', digits = 1) {
  if (units === 'deg') return `${fmtNum(toDeg(rad), digits)}°`;
  const e = angleExpr(rad);
  return e.includes('*pi/180') ? fmtNum(rad, 4) : e.replace(/\*?pi/g, 'π');
}

/**
 * Parse a numeric expression typed by the user: "0.4318", "-pi/2", "2pi/3", "90".
 * Only digits, + - * / ( ) . and "pi" are accepted.
 */
export function parseExpr(input) {
  let s = String(input).trim().toLowerCase().replace(/π/g, 'pi').replace(/°/g, '').replace(/−/g, '-');
  if (!s) return { value: NaN, hasPi: false };
  const hasPi = s.includes('pi');
  s = s.replace(/(\d|\))\s*pi/g, '$1*pi').replace(/pi/g, `(${PI})`);
  if (!/^[\d+\-*/().\s]+$/.test(s)) return { value: NaN, hasPi };
  try {
    const v = Function(`"use strict"; return (${s});`)();
    return { value: typeof v === 'number' && Number.isFinite(v) ? v : NaN, hasPi };
  } catch {
    return { value: NaN, hasPi };
  }
}

/** Text shown in an input for a stored value (angles are stored in radians). */
export function formatInput(v, kind, units) {
  if (kind === 'angle') {
    if (units === 'deg') return fmtNum(toDeg(v), 3);
    const e = angleExpr(v);
    return e.includes('*pi/180') ? fmtNum(v, 5) : e;
  }
  return fmtNum(v, 6);
}

/** Stored value for typed text. Anything containing "pi" is read as radians. */
export function readInput(text, kind, units) {
  const { value, hasPi } = parseExpr(text);
  if (Number.isNaN(value)) return NaN;
  return kind === 'angle' && units === 'deg' && !hasPi ? toRad(value) : value;
}

/** A 4x4 transform as a KaTeX bmatrix. */
export function matTex(T, digits = 3) {
  const rows = [0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => fmtNum(T[r * 4 + c], digits)).join(' & '));
  return `\\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`;
}
