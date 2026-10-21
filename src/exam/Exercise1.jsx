// Exercise 1: from the drawing of a 3R robot to its frames, its DH table and its MATLAB code.
import { useMemo, useState } from 'react';
import { Icon } from '../components/Icons.jsx';
import { examSeed, makeExamRobot } from '../lib/examRobot.js';
import { ExamDrawing, examFloor } from '../three/ExamDrawing.jsx';
import { fitPoints, gridFor } from '../three/RobotScene.jsx';
import { Viewport } from '../three/Viewport.jsx';
import { AnswerTable, CodeAnswer, ExamCard, FramePicker, StudentBadge } from './parts.jsx';

export default function Exercise1({ active, id, answers, actions }) {
  const robot = useMemo(() => makeExamRobot(examSeed(id, 'ex1')), [id]);
  const [viewKey, setViewKey] = useState(0);
  const view = fitPoints([...robot.points, ...robot.elbows], robot.s); // applied when viewKey changes

  const overlay = (
    <>
      <StudentBadge id={id} className="viewport-badge" />
      <div className="viewport-tools">
        <button type="button" className="tool" onClick={() => setViewKey((k) => k + 1)}>
          <Icon name="fit" size={14} /> <span className="tool-text">Fit view</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="exam-grid">
      <ExamCard id={id} kicker="Exercise 1 · Part 1" title="Frames">
        <Viewport
          active={active}
          className="exam-viewport"
          cameraPosition={view.position}
          target={view.target}
          resetKey={`${id}:${viewKey}`}
          grid={{ ...gridFor(robot.s), z: examFloor(robot) }}
          gizmoLabels={['X', 'Y', 'Z']}
          overlay={overlay}
        >
          <ExamDrawing robot={robot} picks={answers.frames} />
        </Viewport>
        <p className="exam-task">
          Choose the directions of the z and x axes of frames {'{0}'} to {'{3}'}. X, Y and Z are the world axes in the
          corner of the 3D view. Dimensions are in metres.
        </p>
        <FramePicker frames={answers.frames} onChange={(k, which, dir) => actions.setAxis('ex1', k, which, dir)} />
      </ExamCard>

      <div className="exam-col">
        <ExamCard id={id} kicker="Exercise 1 · Part 2" title="DH table">
          <p className="exam-task">Fill in the standard DH parameters of each joint.</p>
          <AnswerTable rows={answers.table} onChange={(row, key, text) => actions.setCell('ex1', row, key, text)} />
        </ExamCard>
        <ExamCard id={id} kicker="Exercise 1 · Part 3" title="MATLAB code">
          <p className="exam-task">
            Write the Robotics Toolbox code that creates this robot as a <code>SerialLink</code> object.
          </p>
          <CodeAnswer value={answers.code} onChange={actions.setCode} ariaLabel="MATLAB code" />
        </ExamCard>
      </div>
    </div>
  );
}
