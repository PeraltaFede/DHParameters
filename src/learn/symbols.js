// TeX snippets shared by the Learn steps. Parameters carry their colour.
import { PARAM_COLORS as C } from '../lib/colors.js';

export const t = String.raw;

export const S = {
  th: t`\textcolor{${C.theta}}{\theta_j}`,
  d: t`\textcolor{${C.d}}{d_j}`,
  a: t`\textcolor{${C.a}}{a_j}`,
  al: t`\textcolor{${C.alpha}}{\alpha_j}`,
  zp: t`z_{j-1}`,
  xp: t`x_{j-1}`,
  zj: t`z_j`,
  xj: t`x_j`,
  yj: t`y_j`,
  Fp: t`\{j-1\}`,
  Fj: t`\{j\}`,
  Op: t`O_{j-1}`,
  Oj: t`O_j`,
};

export const RZ = t`R_z(${S.th})`;
export const TZ = t`T_z(${S.d})`;
export const TX = t`T_x(${S.a})`;
export const RX = t`R_x(${S.al})`;

export const LINK_TRANSFORM = t`{}^{j-1}\!A_j \;=\; ${RZ}\; ${TZ}\; ${TX}\; ${RX}`;

export const RZ_SYM = t`${RZ} = \begin{bmatrix} \cos${S.th} & -\sin${S.th} & 0 & 0 \\ \sin${S.th} & \cos${S.th} & 0 & 0 \\ 0 & 0 & 1 & 0 \\ 0 & 0 & 0 & 1 \end{bmatrix}`;
export const TZ_SYM = t`${TZ} = \begin{bmatrix} 1 & 0 & 0 & 0 \\ 0 & 1 & 0 & 0 \\ 0 & 0 & 1 & ${S.d} \\ 0 & 0 & 0 & 1 \end{bmatrix}`;
export const TX_SYM = t`${TX} = \begin{bmatrix} 1 & 0 & 0 & ${S.a} \\ 0 & 1 & 0 & 0 \\ 0 & 0 & 1 & 0 \\ 0 & 0 & 0 & 1 \end{bmatrix}`;
export const RX_SYM = t`${RX} = \begin{bmatrix} 1 & 0 & 0 & 0 \\ 0 & \cos${S.al} & -\sin${S.al} & 0 \\ 0 & \sin${S.al} & \cos${S.al} & 0 \\ 0 & 0 & 0 & 1 \end{bmatrix}`;

const cT = t`\textcolor{${C.theta}}{c_\theta}`;
const sT = t`\textcolor{${C.theta}}{s_\theta}`;
const cA = t`\textcolor{${C.alpha}}{c_\alpha}`;
const sA = t`\textcolor{${C.alpha}}{s_\alpha}`;
const aa = t`\textcolor{${C.a}}{a}`;
const dd = t`\textcolor{${C.d}}{d}`;

export const A_SYM = t`{}^{j-1}\!A_j = \begin{bmatrix} ${cT} & -${sT}${cA} & ${sT}${sA} & ${aa}\,${cT} \\ ${sT} & ${cT}${cA} & -${cT}${sA} & ${aa}\,${sT} \\ 0 & ${sA} & ${cA} & ${dd} \\ 0 & 0 & 0 & 1 \end{bmatrix}`;
