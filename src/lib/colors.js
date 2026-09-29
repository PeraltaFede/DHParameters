// One colour per DH parameter, used everywhere: formulas, sliders, 3D scene, tables.
export const PARAM_COLORS = {
  theta: '#e8890c',
  d: '#9b5de5',
  a: '#0ea5b5',
  alpha: '#e0479e',
};

// Frame axes follow the usual robotics convention: x red, y green, z blue.
export const AXIS_COLORS = ['#e5484d', '#2fa35f', '#3e7bfa'];

// Revolute joints share the theta colour, prismatic joints the d colour.
export const JOINT_COLORS = { R: PARAM_COLORS.theta, P: PARAM_COLORS.d };

export const SCENE_PALETTE = {
  light: {
    bg: '#eef1f6',
    grid1: '#aab3c2',
    grid2: '#d3d9e2',
    neutral: '#4b5563',
    rod: '#8e98aa',
    axisLine: '#6b7486',
    ghost: '#8a93a3',
    accent: '#2f6fed',
    base: '#b8c0cc',
  },
  dark: {
    bg: '#0b0e13',
    grid1: '#3a4351',
    grid2: '#1e252f',
    neutral: '#c8cfdb',
    rod: '#667286',
    axisLine: '#8b95a6',
    ghost: '#7d8797',
    accent: '#6c9dff',
    base: '#343c49',
  },
};
