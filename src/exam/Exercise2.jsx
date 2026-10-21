// Exercise 2: from the MATLAB code of a 3R robot to its DH table, its frames and the robot itself.
// The robot behind the code is never drawn: both 3D views show only what the student entered.
import { useMemo, useState } from 'react';
import { Icon } from '../components/Icons.jsx';
import { Highlighted } from '../components/ui.jsx';
import { add, normalize, scale } from '../lib/dh.js';
import { examMatlab, examSeed, makeExamRobot } from '../lib/examRobot.js';
import { BasePlate, PLATE, plateTop, StudentFrames } from '../three/ExamDrawing.jsx';
import { StudentRobot } from '../three/StudentRobot.jsx';
import { Viewport } from '../three/Viewport.jsx';
import { chainGeometry, frameOrigin } from './answers.js';
import { AnswerTable, ChainEditor, ExamCard, FramePicker, StudentBadge } from './parts.jsx';

// A fixed view of the space around the base (about a metre across), from the usual direction:
// fitting it to the hidden robot would give its size away.
const TARGET = [0, 0, 0.25];
const VIEW = { target: TARGET, position: add(TARGET, scale(normalize([0.62, -0.68, 0.4]), 2.4)) };
const GRID = { size: 3, divisions: 30 }; // 0.1 m squares

function ExamView({ id, active, floor, viewKey, onFit, tools, children }) {
  return (
    <Viewport
      active={active}
      className="exam-viewport"
      cameraPosition={VIEW.position}
      target={VIEW.target}
      resetKey={`${id}:${viewKey}`}
      grid={{ ...GRID, z: floor }}
      gizmoLabels={['X', 'Y', 'Z']}
      overlay={
        <>
          <StudentBadge id={id} className="viewport-badge" />
          <div className="viewport-tools">
            {tools}
            <button type="button" className="tool" onClick={onFit}>
              <Icon name="fit" size={14} /> <span className="tool-text">Fit view</span>
            </button>
          </div>
        </>
      }
    >
      {children}
    </Viewport>
  );
}

export default function Exercise2({ active, id, answers, actions }) {
  const code = useMemo(() => examMatlab(makeExamRobot(examSeed(id, 'ex2'), { worldBase: true, zeroPose: true })), [id]);
  const frames = useMemo(() => answers.frames.map((f) => ({ ...f, o: frameOrigin(f) })), [answers.frames]);
  const robot = useMemo(() => chainGeometry(answers.robot), [answers.robot]);
  const [frameView, setFrameView] = useState(0);
  const [robotView, setRobotView] = useState(0);
  const [showFrames, setShowFrames] = useState(true);

  return (
    <div className="exam-stack">
      <ExamCard id={id} kicker="Exercise 2 · Part 1" title="DH table">
        <div className="exam-split">
          <div>
            <p className="exam-task">This code creates a robot with the Robotics Toolbox for MATLAB. Fill in its DH table.</p>
            <pre className="code code-given">
              <code>
                <Highlighted code={code} lang="matlab" />
              </code>
            </pre>
          </div>
          <AnswerTable rows={answers.table} onChange={(row, key, text) => actions.setCell('ex2', row, key, text)} />
        </div>
      </ExamCard>

      <ExamCard id={id} kicker="Exercise 2 · Part 2" title="Frames">
        <div className="exam-split">
          <ExamView id={id} active={active} floor={plateTop(null) - PLATE} viewKey={frameView} onFit={() => setFrameView((k) => k + 1)}>
            <BasePlate top={plateTop(null)} />
            <StudentFrames frames={frames} names />
          </ExamView>
          <div>
            <p className="exam-task">
              Place frames {'{0}'} to {'{3}'} with the robot in its zero pose (q = 0): type each origin in world coordinates
              and choose the directions of its z and x axes.
            </p>
            <FramePicker
              frames={answers.frames}
              onChange={(k, which, dir) => actions.setAxis('ex2', k, which, dir)}
              onOrigin={actions.setOrigin}
            />
          </div>
        </div>
      </ExamCard>

      <ExamCard id={id} kicker="Exercise 2 · Part 3" title="Robot">
        <div className="exam-split">
          <ExamView
            id={id}
            active={active}
            floor={plateTop(robot.joints[0].axis) - PLATE}
            viewKey={robotView}
            onFit={() => setRobotView((k) => k + 1)}
            tools={
              <button type="button" className={`tool${showFrames ? ' on' : ''}`} onClick={() => setShowFrames((v) => !v)} aria-pressed={showFrames}>
                <Icon name="axes" size={14} /> <span className="tool-text">My frames</span>
              </button>
            }
          >
            <StudentRobot geometry={robot} />
            {showFrames && <StudentFrames frames={frames} names faded />}
          </ExamView>
          <div>
            <p className="exam-task">
              Draw the robot in its zero pose, from its base at the world origin: choose the axis of each joint and build each
              link from straight segments.
            </p>
            <ChainEditor robot={answers.robot} actions={actions} />
          </div>
        </div>
      </ExamCard>
    </div>
  );
}
