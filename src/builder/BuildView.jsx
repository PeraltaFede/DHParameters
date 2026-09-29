import { useMemo, useState } from 'react';
import { Icon } from '../components/Icons.jsx';
import { Segmented } from '../components/ui.jsx';
import { jointTypes } from '../lib/codegen.js';
import { fkine, robotScale } from '../lib/dh.js';
import { instantiatePreset, makeJoint, PRESETS } from '../lib/presets.js';
import { fitView, gridFor, RobotScene } from '../three/RobotScene.jsx';
import { Viewport } from '../three/Viewport.jsx';
import { CodePanel } from './CodePanel.jsx';
import { JointTable } from './JointTable.jsx';
import { JointSliders, PosePanel } from './panels.jsx';
import { normalizeJoint, withType } from './robotState.js';

const MAX_JOINTS = 12;

export default function BuildView({ active, robot, setRobot }) {
  const { joints, units } = robot;
  const [viewKey, setViewKey] = useState(0);
  const [showFrames, setShowFrames] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [preset, setPreset] = useState('');

  const frames = useMemo(() => fkine(joints), [joints]);
  const s = useMemo(() => robotScale(joints), [joints]);
  const view = fitView(frames, s); // applied only when viewKey changes

  const set = (patch) => setRobot((r) => ({ ...r, ...patch }));
  const setOpts = (patch) => setRobot((r) => ({ ...r, opts: { ...r.opts, ...patch } }));
  const mapJoints = (fn) => setRobot((r) => ({ ...r, joints: fn(r.joints) }));

  const updateJoint = (id, patch) => mapJoints((js) => js.map((j) => (j.id === id ? normalizeJoint({ ...j, ...patch }) : j)));
  const changeType = (id, type) => mapJoints((js) => js.map((j) => (j.id === id ? withType(j, type) : j)));
  const removeJoint = (id) => mapJoints((js) => (js.length > 1 ? js.filter((j) => j.id !== id) : js));
  const moveJoint = (id, dir) =>
    mapJoints((js) => {
      const i = js.findIndex((j) => j.id === id);
      const k = i + dir;
      if (i < 0 || k < 0 || k >= js.length) return js;
      const next = [...js];
      [next[i], next[k]] = [next[k], next[i]];
      return next;
    });
  const addJoint = (type) => mapJoints((js) => (js.length < MAX_JOINTS ? [...js, makeJoint(type)] : js));
  const zeroPose = () => mapJoints((js) => js.map((j) => normalizeJoint({ ...j, q: 0 })));

  const loadPreset = (id) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setRobot((r) => ({ ...r, ...instantiatePreset(p) }));
    setPreset('');
    setViewKey((k) => k + 1);
  };

  const overlay = (
    <div className="viewport-tools">
      <button type="button" className={`tool${showFrames ? ' on' : ''}`} onClick={() => setShowFrames((v) => !v)} aria-pressed={showFrames}>
        <Icon name="axes" size={14} /> <span className="tool-text">Frames</span>
      </button>
      <button type="button" className={`tool${showLabels ? ' on' : ''}`} onClick={() => setShowLabels((v) => !v)} aria-pressed={showLabels}>
        <Icon name="tag" size={14} /> <span className="tool-text">Labels</span>
      </button>
      <button type="button" className="tool" onClick={() => setViewKey((k) => k + 1)}>
        <Icon name="fit" size={14} /> <span className="tool-text">Fit view</span>
      </button>
    </div>
  );

  return (
    <div className="builder" hidden={!active}>
      <section className="panel toolbar">
        <label className="field">
          <span>Start from</span>
          <select value={preset} onChange={(e) => loadPreset(e.target.value)}>
            <option value="" disabled>
              Load a preset robot…
            </option>
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Robot name</span>
          <input type="text" value={robot.name} onChange={(e) => set({ name: e.target.value })} spellCheck={false} />
        </label>
        <div className="field">
          <span>Angles in</span>
          <Segmented
            value={units}
            onChange={(u) => set({ units: u })}
            ariaLabel="Angle units"
            options={[
              { value: 'deg', label: 'degrees' },
              { value: 'rad', label: 'radians' },
            ]}
          />
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>
            Joints{' '}
            <span className="muted">
              {joints.length} · {jointTypes(joints)}
            </span>
          </h3>
          <div className="head-actions">
            <button type="button" className="btn sm" onClick={() => addJoint('R')} disabled={joints.length >= MAX_JOINTS}>
              <Icon name="plus" size={14} /> Revolute
            </button>
            <button type="button" className="btn sm" onClick={() => addJoint('P')} disabled={joints.length >= MAX_JOINTS}>
              <Icon name="plus" size={14} /> Prismatic
            </button>
          </div>
        </div>
        <JointTable robot={robot} onChange={updateJoint} onType={changeType} onMove={moveJoint} onRemove={removeJoint} />
        <p className="hint table-hint">
          Each row is one link. The joint variable (<span className="var-inline theta">θ</span> for R,{' '}
          <span className="var-inline d">d</span> for P) is <b>q</b>, which you move with the sliders below the 3D view.
          Fields accept expressions such as <code>pi/2</code> or <code>-0.15</code>. Anything with <code>pi</code> is read
          as radians.
        </p>
      </section>

      <div className="builder-grid">
        <section className="panel viewer-panel">
          <Viewport
            active={active}
            cameraPosition={view.position}
            target={view.target}
            resetKey={viewKey}
            grid={gridFor(s)}
            overlay={overlay}
          >
            <RobotScene joints={joints} frames={frames} s={s} showFrames={showFrames} showLabels={showLabels} />
          </Viewport>
          <JointSliders joints={joints} units={units} onQ={(id, q) => updateJoint(id, { q })} onZero={zeroPose} />
          <PosePanel T={frames[frames.length - 1]} n={joints.length} />
        </section>

        <section className="panel">
          <CodePanel robot={robot} setOpts={setOpts} />
        </section>
      </div>
    </div>
  );
}
