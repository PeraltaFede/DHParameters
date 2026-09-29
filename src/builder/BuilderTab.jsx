import { Segmented } from '../components/ui.jsx';
import { uid } from '../lib/presets.js';
import BuildView from './BuildView.jsx';
import PracticeView from './practice/PracticeView.jsx';

const VIEWS = [
  { value: 'build', label: 'Build' },
  { value: 'practice', label: 'Practice' },
];

/** The Robot builder: design a robot (Build) or solve graded exercises (Practice). */
export default function BuilderTab({ active, robot, setRobot, view, setView }) {
  const openInBuild = ({ name, joints }) => {
    setRobot((r) => ({ ...r, name, joints: joints.map((j) => ({ ...j, qlim: [...j.qlim], id: uid() })) }));
    setView('build');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="builder-tab" hidden={!active}>
      <div className="subnav">
        <Segmented value={view} onChange={setView} ariaLabel="Robot builder view" options={VIEWS} />
        <span className="subnav-hint">
          {view === 'build'
            ? 'Design a robot joint by joint and get its Robotics Toolbox code.'
            : 'Graded exercises: reach a pose, model a robot, or both.'}
        </span>
      </div>
      <BuildView active={active && view === 'build'} robot={robot} setRobot={setRobot} />
      <PracticeView active={active && view === 'practice'} onOpenInBuild={openInBuild} />
    </div>
  );
}
