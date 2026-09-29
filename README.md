# DH Parameters - Robotics

An interactive page for learning Denavit–Hartenberg parameters in the notation of
Peter Corke's *Robotics, Vision and Control* (standard DH), and for generating
Robotics Toolbox code for your own robot.

Made by Federico Peralta for the Robotics course at Universidad Loyola Andalucía.

## Use it

Open `dist/index.html` in a browser (double-click works). It is a single
self-contained file that needs no server, no Node, and no internet connection.

## The two tabs

**1 · Learn one joint** is a 9-step lesson with a 3D view of link *j*:

1. Overview: frames {j−1}, {j} and the link transform `A = Rz(θ)·Tz(d)·Tx(a)·Rx(α)`
2. Joint type and axis: revolute vs prismatic, σ, which parameter is the joint variable
3. Frame-placement rules and special cases (skew, parallel, intersecting, coincident axes)
4. θ joint angle, 5. d link offset, 6. a link length, 7. α link twist. Each has a slider,
   an animation of its elementary transform, and the symbolic and numeric matrix.
8. The full link transform, with the same link in RTB MATLAB/Python code, and standard vs. modified DH
9. Practice: match a random target frame, with hints

Under the 3D view, the transform sequence bar plays or scrubs the moving frame
through Rz → Tz → Tx → Rx. Every 3D view has an x/y/z gizmo in the corner
(x red, y green, z blue) that turns with the camera.

**2 · Robot builder** turns a table of joints (R/P, θ, d, a, α, offset, qlim)
into:

- a live 3D model you can drive with joint sliders, plus the end-effector pose ⁰Tₙ
- **MATLAB** code for RTB 10, the toolbox of RVC 2nd ed.: `Revolute/Prismatic(...)` or classic
  `Link([θ d a α σ offset])`, then `SerialLink`
- **Python** code for roboticstoolbox-python (RVC 3rd ed.): `DHRobot([RevoluteDH(...), PrismaticDH(...)])`
- the DH table as the toolbox prints it, and the ETS string

It has presets (planar 2R/3R, SCARA, cylindrical, Cartesian, Stanford, Puma 560)
and uses standard DH throughout. Inputs accept expressions such as `pi/2`. The
robot you build is remembered in your browser.

**Practice** (the builder's second view) has graded exercises on the same robots, with
link sizes randomized so every student gets different numbers:

| Level | Given | The student finds |
|---|---|---|
| 1 · Reach | the DH table and a target pose | joint values q that reach it |
| 2 · Model | a 3D drawing: dimensions, joint numbers, positive directions, frames {0} and {n} | the DH table |
| 3 · Model + reach | the drawing and a target pose | the DH table, then q |

A model is accepted when every joint type, every joint axis (position and direction)
and the tool frame match the drawing. That holds for any valid choice of x-axes and
offsets, and it means the model moves exactly like the real robot for every q.
Hint points at the first thing that is wrong; Reveal shows a solution, which then
doesn't count. Progress is saved in the browser, and the answer is always shown as
MATLAB/Python code.

## Develop

Requires [Node.js](https://nodejs.org) 20.19+ (LTS recommended).

```sh
npm install
npm run dev       # dev server with hot reload
npm run build     # writes the single-file dist/index.html
```

Stack: React 19, Vite, three.js via @react-three/fiber and drei, KaTeX.

```
src/
  lib/dh.js          DH math: Rz, Tz, Tx, Rx, link transforms, forward kinematics
  lib/codegen.js     MATLAB / Python / DH-table / ETS generators
  lib/presets.js     preset robots
  learn/             lesson steps, sequence bar, practice mode
  builder/           joint table, code panel, builder state
  three/             3D primitives, single-joint scene, robot scene, viewport
```
