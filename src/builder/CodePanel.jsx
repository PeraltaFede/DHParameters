import { useMemo, useState } from 'react';
import { Icon } from '../components/Icons.jsx';
import { Check, CopyButton, downloadText, Highlighted, Segmented } from '../components/ui.jsx';
import { dhTableText, etsString, matlabCode, pythonCode, safeIdent } from '../lib/codegen.js';

const TABS = [
  { value: 'matlab', label: 'MATLAB' },
  { value: 'python', label: 'Python' },
  { value: 'table', label: 'DH table' },
];

export function CodePanel({ robot, setOpts }) {
  const [tab, setTab] = useState('matlab');
  const { opts } = robot;

  const code = useMemo(() => {
    if (tab === 'matlab') return matlabCode(robot);
    if (tab === 'python') return pythonCode(robot);
    return dhTableText(robot);
  }, [robot, tab]);

  const ident = safeIdent(robot.name);
  const filename = tab === 'matlab' ? `mdl_${ident}.m` : tab === 'python' ? `${ident}.py` : `${ident}_dh.txt`;

  return (
    <div className="code-panel">
      <div className="panel-head">
        <Segmented value={tab} onChange={setTab} options={TABS} ariaLabel="Output" />
        <div className="code-actions">
          <CopyButton text={code} />
          <button type="button" className="btn sm" onClick={() => downloadText(code, filename)}>
            <Icon name="download" size={14} /> {filename}
          </button>
        </div>
      </div>

      {tab !== 'table' && (
        <div className="code-opts">
          {tab === 'matlab' && (
            <Segmented
              size="sm"
              value={opts.matlabStyle}
              onChange={(matlabStyle) => setOpts({ matlabStyle })}
              ariaLabel="MATLAB style"
              options={[
                { value: 'named', label: 'Revolute(…) / Prismatic(…)' },
                { value: 'matrix', label: 'Link([θ d a α σ])' },
              ]}
            />
          )}
          <Check checked={opts.qlimRevolute} onChange={(qlimRevolute) => setOpts({ qlimRevolute })}>
            qlim for revolute joints
          </Check>
          <Check checked={opts.demo} onChange={(demo) => setOpts({ demo })}>
            “try it” lines
          </Check>
        </div>
      )}

      <pre className={`code code-${tab}`}>
        <code>{tab === 'table' ? code : <Highlighted code={code} lang={tab} />}</code>
      </pre>

      {tab === 'table' && (
        <div className="ets">
          <div className="ets-title">Elementary transform sequence (ETS)</div>
          <code>{etsString(robot) || '(identity)'}</code>
        </div>
      )}

      <p className="hint">
        {tab === 'matlab' && (
          <>
            Needs the Robotics Toolbox for MATLAB, RTB 10 (the version used in RVC 2nd ed.). Prismatic joints always get{' '}
            <code>qlim</code> because <code>plot</code> needs it to draw them.
          </>
        )}
        {tab === 'python' && (
          <>
            Needs <code>pip install roboticstoolbox-python</code> (the toolbox used in RVC 3rd ed.). Prismatic joints always
            get <code>qlim</code>.
          </>
        )}
        {tab === 'table' && (
          <>
            Joint variables appear as <code>q1…qn</code>, including any offset. This is what <code>robot</code> (MATLAB)
            or <code>print(robot)</code> (Python) displays.
          </>
        )}
      </p>
    </div>
  );
}
