// The Robot exam. The student starts it with their student ID; from then on the other tabs are
// gone, every card shows the ID (the answers are handed in as screenshots) and nothing is
// checked, hinted or revealed.
import { useEffect, useState } from 'react';
import { Icon } from '../components/Icons.jsx';
import { Callout, Segmented } from '../components/ui.jsx';
import { idDigits } from './examState.js';
import Exercise1 from './Exercise1.jsx';
import Exercise2 from './Exercise2.jsx';
import { ExamCard } from './parts.jsx';

// The exam's exercises. Each keeps its answers under its id and builds its robot from
// examSeed(studentId, id), so the two robots differ.
const EXERCISES = [
  { id: 'ex1', label: 'Exercise 1 · Drawing → MATLAB', Component: Exercise1 },
  { id: 'ex2', label: 'Exercise 2 · MATLAB → robot', Component: Exercise2 },
];

function Instructions() {
  return (
    <ol className="exam-steps">
      <li>
        Type your student ID and press <b>Start exam</b>. From then on, only this tab is available.
      </li>
      <li>
        The exam has <b>two exercises</b>: switch between them at the top. Every card says which exercise and part it is.
      </li>
      <li>
        <b>Exercise 1 · Drawing → MATLAB.</b> A 3D drawing shows a robot with three revolute joints and its dimensions in
        metres. Part 1: choose the directions of the z and x axes of frames {'{0}'} to {'{3}'} (X, Y and Z are the world
        axes in the corner of the 3D view). Part 2: fill in σ, θ, d, a and α of each joint (standard DH). Part 3: write,
        from scratch, the Robotics Toolbox code that creates the robot as a <code>SerialLink</code> object.
      </li>
      <li>
        <b>Exercise 2 · MATLAB → robot.</b> Robotics Toolbox code creates a robot with three revolute joints. Part 1: fill
        in its DH table. Part 2: place frames {'{0}'} to {'{3}'} with the robot in its zero pose, q = 0 (origins in world
        coordinates, in metres, and the z and x directions). Part 3: draw the robot in its zero pose, from its base at the world
        origin: the axis of each joint and each link as straight segments.
      </li>
      <li>
        Nothing is checked or corrected here. When you finish, take a <b>screenshot of each part of each exercise</b> (6
        in total) and hand them in. Your student ID appears on every card: make sure it can be read in each screenshot.
      </li>
      <li>
        Your work is saved in this browser. <b>Clear</b> erases your student ID and all your answers in both exercises.
      </li>
    </ol>
  );
}

export default function ExamTab({ active, exam, actions }) {
  const [draft, setDraft] = useState('');
  const [confirming, setConfirming] = useState(false);
  const started = exam.id !== '';
  const ex = EXERCISES.find((e) => e.id === exam.current) ?? EXERCISES[0];

  // A start or clear (here or in another open tab) closes the warning.
  useEffect(() => setConfirming(false), [exam.id]);

  if (!started) {
    return (
      <div className="exam" hidden={!active}>
        <section className="panel exam-gate">
          <span className="exam-kicker">Robot exam</span>
          <h2>Two exercises: drawing → MATLAB and MATLAB → robot</h2>
          <Instructions />
          <form
            className="exam-start"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft) return;
              actions.start(draft);
              setDraft('');
            }}
          >
            <label className="field">
              <span>Student ID</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                maxLength={20}
                value={draft}
                onChange={(e) => setDraft(idDigits(e.target.value))}
              />
            </label>
            <button type="submit" className="btn primary" disabled={!draft}>
              Start exam <Icon name="right" size={15} />
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="exam" hidden={!active}>
      <section className="panel toolbar exam-bar">
        <div className="field">
          <span>Student ID</span>
          <div className="exam-id-row">
            <input type="text" className="exam-id" value={exam.id} readOnly aria-label="Student ID" />
            <button type="button" className="btn" onClick={() => setConfirming((v) => !v)} aria-expanded={confirming}>
              <Icon name="trash" size={15} /> Clear
            </button>
          </div>
        </div>
        <div className="field exam-switch">
          <span>Exercise</span>
          <Segmented
            value={ex.id}
            onChange={actions.setCurrent}
            ariaLabel="Exercise"
            options={EXERCISES.map((e) => ({ value: e.id, label: e.label }))}
          />
        </div>
        {confirming && (
          <Callout tone="danger" title="Clear the exam?">
            This erases your student ID and everything you have done in this exam, in both exercises. It cannot be undone.
            <div className="actions">
              <button type="button" className="btn sm" onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button type="button" className="btn sm danger" onClick={actions.clear}>
                <Icon name="trash" size={14} /> Clear everything
              </button>
            </div>
          </Callout>
        )}
      </section>

      <ExamCard id={exam.id} kicker="Robot exam" title="Instructions">
        <Instructions />
      </ExamCard>

      <ex.Component key={ex.id} active={active} id={exam.id} answers={exam[ex.id]} actions={actions} />
    </div>
  );
}
