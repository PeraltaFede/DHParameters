// The lesson: one step per concept. Each step says which part of the 3D scene
// to highlight (focus) and which slice of Rz·Tz·Tx·Rx to animate (seq).
import { Icon } from '../components/Icons.jsx';
import { M, Tex } from '../components/Tex.jsx';
import { Callout, CodeBlock, Segmented } from '../components/ui.jsx';
import { singleLinkCode } from '../lib/codegen.js';
import { PARAM_COLORS as C } from '../lib/colors.js';
import { linkStd, Rx, Rz, toDeg, toRad, Tx, Tz } from '../lib/dh.js';
import { fmtNum, matTex } from '../lib/format.js';
import { ParamSlider } from './ParamSlider.jsx';
import { compare } from './practice.js';
import { A_SYM, LINK_TRANSFORM, RX_SYM, RZ_SYM, S, t, TX_SYM, TZ_SYM } from './symbols.js';

/** A parameter name in its colour, for running text. */
const P = ({ k, children }) => (
  <b className="pname" style={{ color: C[k] }}>
    {children}
  </b>
);

function Numeric({ label, T }) {
  return <Tex block>{`${label} = ${matTex(T)}`}</Tex>;
}

function PlayButton({ ctx, from, to, children }) {
  return (
    <button type="button" className="btn sm" onClick={() => ctx.playSeq(from, to)} disabled={ctx.playing}>
      <Icon name="play" size={13} /> {children}
    </button>
  );
}

function VariableNote({ ctx, param }) {
  const R = ctx.p.type === 'R';
  const isVar = (param === 'theta' && R) || (param === 'd' && !R);
  const sym = param === 'theta' ? S.th : S.d;
  return isVar ? (
    <Callout tone="var" style={{ '--c': C[param] }} title={`This is the joint variable (${R ? 'revolute' : 'prismatic'} joint)`}>
      Joint <M>j</M> is {R ? 'revolute' : 'prismatic'}, so <M>{t`${sym} = q_j`}</M> changes whenever the joint moves. The
      Robotics Toolbox adds an optional constant: <M>{t`${sym} = q_j + \text{offset}_j`}</M>.
    </Callout>
  ) : (
    <Callout title="Constant for this joint">
      Joint <M>j</M> is {R ? 'revolute' : 'prismatic'}, so <M>{sym}</M> is a fixed number, set by the shape of the
      link. (Switch the joint type in step 2 to make it the variable.)
    </Callout>
  );
}

const PARAM_ROWS = [
  { k: 'theta', sym: S.th, name: 'joint angle', motion: 'rotation', ref: t`\text{about } z_{j-1}` },
  { k: 'd', sym: S.d, name: 'link offset', motion: 'translation', ref: t`\text{along } z_{j-1}` },
  { k: 'a', sym: S.a, name: 'link length', motion: 'translation', ref: t`\text{along } x_j` },
  { k: 'alpha', sym: S.al, name: 'link twist', motion: 'rotation', ref: t`\text{about } x_j` },
];

function Legend() {
  return (
    <div className="legend">
      <span>
        <i className="sw" style={{ background: '#e5484d' }} /> x
      </span>
      <span>
        <i className="sw" style={{ background: '#2fa35f' }} /> y
      </span>
      <span>
        <i className="sw" style={{ background: '#3e7bfa' }} /> z
      </span>
      <span>
        <i className="sw dot accent" /> moving frame
      </span>
      <span>
        <i className="sw ghost" /> intermediate frames
      </span>
    </div>
  );
}

/* ================================================================== steps */

export const STEPS = [
  {
    id: 'overview',
    short: 'Overview',
    title: 'One link, two frames',
    focus: 'all',
    seq: [0, 4],
    autoplay: false, // plays only on request (▶ or "Watch the frame travel")
    render: (ctx) => (
      <>
        <p>
          A serial robot arm is a chain of rigid <b>links</b> connected by <b>joints</b>. In the notation of Peter
          Corke's <i>Robotics, Vision and Control</i> (RVC), link <M>j</M> connects joint <M>j</M> to joint <M>j+1</M>,
          and coordinate frame <M>{S.Fj}</M> is attached to the <b>far end</b> of link <M>j</M>.
        </p>
        <p>
          Where frame <M>{S.Fj}</M> sits relative to frame <M>{S.Fp}</M> takes just <b>four numbers</b>, the
          Denavit–Hartenberg parameters:
        </p>
        <table className="mini-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th>Motion</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {PARAM_ROWS.map((r) => (
              <tr key={r.k}>
                <td>
                  <M>{r.sym}</M>
                </td>
                <td>
                  <P k={r.k}>{r.name}</P>
                </td>
                <td>{r.motion}</td>
                <td>
                  <M>{r.ref}</M>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>They are applied as four elementary transforms, in this order. The product is the <b>link transform</b>:</p>
        <Tex block>{LINK_TRANSFORM}</Tex>
        <p>
          Read it from left to right. Start at <M>{S.Fp}</M>, rotate about <M>z</M>, slide along <M>z</M>, slide along the
          new <M>x</M>, then rotate about that <M>x</M>. Where you end up is <M>{S.Fj}</M>.
        </p>
        <div className="actions">
          <PlayButton ctx={ctx} from={0} to={4}>
            Watch the frame travel
          </PlayButton>
        </div>
        <Legend />
      </>
    ),
  },

  {
    id: 'axis',
    short: 'Joint & axis',
    title: 'Joint type and joint axis',
    focus: 'axis',
    render: (ctx) => {
      const { p } = ctx;
      const R = p.type === 'R';
      return (
        <>
          <p>
            <b>The z-axes are the joint axes.</b> Joint <M>j</M> rotates about, or slides along, <M>{S.zp}</M>, which is
            the z-axis of the frame <i>before</i> it. In the same way, <M>{S.zj}</M> is the axis of the next joint,{' '}
            <M>j+1</M>.
          </p>
          <div className="field-row">
            <span className="field-label">Joint type</span>
            <Segmented
              value={p.type}
              onChange={ctx.setType}
              ariaLabel="Joint type"
              options={[
                { value: 'R', label: 'Revolute' },
                { value: 'P', label: 'Prismatic' },
              ]}
            />
          </div>
          <table className="mini-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>
                  <M>{t`\sigma_j`}</M>
                </th>
                <th>Motion</th>
                <th>Variable</th>
              </tr>
            </thead>
            <tbody>
              <tr className={R ? 'hl' : ''}>
                <td>Revolute</td>
                <td>0</td>
                <td>
                  rotates about <M>{S.zp}</M>
                </td>
                <td>
                  <M>{t`q_j = ${S.th}`}</M>
                </td>
              </tr>
              <tr className={!R ? 'hl' : ''}>
                <td>Prismatic</td>
                <td>1</td>
                <td>
                  slides along <M>{S.zp}</M>
                </td>
                <td>
                  <M>{t`q_j = ${S.d}`}</M>
                </td>
              </tr>
            </tbody>
          </table>
          <ParamSlider
            param={R ? 'theta' : 'd'}
            value={R ? p.theta : p.d}
            onChange={(v) => ctx.setParam(R ? 'theta' : 'd', v)}
            sym="q_j"
            name={R ? 'joint coordinate (angle)' : 'joint coordinate (length)'}
            variable
          />
          <div className="actions">
            <button type="button" className="btn sm" onClick={ctx.wiggle} disabled={ctx.playing}>
              <Icon name="play" size={13} /> Move the joint
            </button>
          </div>
          <p>
            Only <b>one</b> of the four parameters changes when the robot moves: the joint variable. The other three are
            constants, fixed by the mechanical design of the link.
          </p>
          <Callout title="In the Robotics Toolbox">
            Each link stores its type as <code>sigma</code> (0 = revolute, 1 = prismatic). You give the three constants
            when you create the link with <code>Revolute(…)</code> / <code>Prismatic(…)</code> in MATLAB or{' '}
            <code>RevoluteDH(…)</code> / <code>PrismaticDH(…)</code> in Python. The joint coordinates <M>q</M> are
            supplied later, e.g. <code>robot.fkine(q)</code>. Joint limits go in <code>qlim</code>.
          </Callout>
        </>
      );
    },
  },

  {
    id: 'rules',
    short: 'Frame rules',
    title: 'Placing the frames',
    focus: 'frames',
    render: (ctx) => (
      <>
        <p>
          Before measuring anything, place the frames. These rules fix where each frame goes on a real mechanism. The
          next four steps then measure <M>{S.th}</M>, <M>{S.d}</M>, <M>{S.a}</M> and <M>{S.al}</M> between them:
        </p>
        <ol className="rules">
          <li>
            <M>{S.zp}</M> lies along the axis of joint <M>j</M>, and <M>{S.zj}</M> along the axis of joint <M>j+1</M>.
          </li>
          <li>
            <M>{S.xj}</M> lies along the <b>common normal</b> from <M>{S.zp}</M> to <M>{S.zj}</M>, pointing away from{' '}
            <M>{S.zp}</M>.
          </li>
          <li>
            The origin <M>{S.Oj}</M> is where <M>{S.xj}</M> meets <M>{S.zj}</M>.
          </li>
          <li>
            <M>{S.yj}</M> completes a right-handed frame: <M>{t`y_j = z_j \times x_j`}</M>.
          </li>
        </ol>
        <h4>Special cases (click one to try it)</h4>
        <div className="case-grid">
          <button type="button" className="case" onClick={() => ctx.tweenP({ theta: toRad(60), d: 0.6, a: 0.9, alpha: toRad(50) })}>
            <b>Skew axes</b>
            <span>
              The general case: the axes neither meet nor are parallel, so there is exactly one common normal. Its
              length will be <M>{S.a}</M>, and the angle between the axes <M>{S.al}</M>.
            </span>
          </button>
          <button type="button" className="case" onClick={() => ctx.tweenP({ d: 0, a: 0.9, alpha: 0 })}>
            <b>Parallel axes</b>
            <span>
              Infinitely many common normals. Pick one, usually the one through <M>{S.Op}</M>, so that{' '}
              <M>{t`d_j = 0`}</M> (and <M>{t`\alpha_j = 0`}</M>).
            </span>
          </button>
          <button type="button" className="case" onClick={() => ctx.tweenP({ a: 0, alpha: toRad(90) })}>
            <b>Intersecting axes</b>
            <span>
              The common normal has zero length (<M>{t`a_j = 0`}</M>). Take{' '}
              <M>{t`x_j = \pm\, z_{j-1} \times z_j`}</M>; <M>{S.Oj}</M> sits at the intersection.
            </span>
          </button>
          <button type="button" className="case" onClick={() => ctx.tweenP({ a: 0, alpha: 0 })}>
            <b>Same line</b>
            <span>
              Both axes lie on one line (<M>{t`a_j = 0,\ \alpha_j = 0`}</M>), so the direction of <M>{S.xj}</M> is
              free.
            </span>
          </button>
        </div>
        <Callout title="The first and last frames">
          Base frame <M>{t`\{0\}`}</M>: <M>{t`z_0`}</M> lies along joint 1. Its origin and <M>{t`x_0`}</M> are free, so
          choose them to make as many parameters zero as you can. Tool frame <M>{t`\{n\}`}</M> is also free, and
          conventionally <M>{t`z_n`}</M> points along the tool's approach direction. RTB adds separate <code>base</code>{' '}
          and <code>tool</code> transforms for anything the DH table can't express.
        </Callout>
      </>
    ),
  },

  {
    id: 'theta',
    short: 'θ angle',
    color: C.theta,
    title: (
      <>
        <M>{S.th}</M> joint angle
      </>
    ),
    focus: 'theta',
    seq: [0, 1],
    render: (ctx) => (
      <>
        <p>
          <M>{S.th}</M> is the angle <b>from</b> <M>{S.xp}</M> <b>to</b> <M>{S.xj}</M>, measured <b>about</b>{' '}
          <M>{S.zp}</M>.
        </p>
        <p>
          Its sign follows the <b>right-hand rule</b>: point your right thumb along <M>{S.zp}</M>, and your fingers curl in
          the positive direction (counter-clockwise when you look down on the xy-plane).
        </p>
        <ParamSlider param="theta" value={ctx.p.theta} onChange={(v) => ctx.setParam('theta', v)} variable={ctx.p.type === 'R'} />
        <div className="actions">
          <PlayButton ctx={ctx} from={0} to={1}>
            Play <M>{t`R_z(\theta_j)`}</M>
          </PlayButton>
        </div>
        <div className="math">
          <Tex block>{RZ_SYM}</Tex>
          <Numeric label={t`R_z(${fmtNum(toDeg(ctx.p.theta), 0)}^\circ)`} T={Rz(ctx.p.theta)} />
        </div>
        <VariableNote ctx={ctx} param="theta" />
        <p className="note">
          In the 3D view, the dashed <P k="theta">orange ray</P> shows where <M>x</M> points after the rotation. That
          direction is parallel to <M>{S.xj}</M>.
        </p>
      </>
    ),
  },

  {
    id: 'd',
    short: 'd offset',
    color: C.d,
    title: (
      <>
        <M>{S.d}</M> link offset
      </>
    ),
    focus: 'd',
    seq: [1, 2],
    render: (ctx) => (
      <>
        <p>
          <M>{S.d}</M> is the distance <b>along</b> <M>{S.zp}</M> from the origin <M>{S.Op}</M> to the point where{' '}
          <M>{S.xj}</M> crosses <M>{S.zp}</M> (the grey dot).
        </p>
        <ParamSlider param="d" value={ctx.p.d} onChange={(v) => ctx.setParam('d', v)} variable={ctx.p.type === 'P'} />
        <div className="actions">
          <PlayButton ctx={ctx} from={1} to={2}>
            Play <M>{t`T_z(d_j)`}</M>
          </PlayButton>
        </div>
        <div className="math">
          <Tex block>{TZ_SYM}</Tex>
          <Numeric label={t`T_z(${fmtNum(ctx.p.d, 2)})`} T={Tz(ctx.p.d)} />
        </div>
        <VariableNote ctx={ctx} param="d" />
        <ul className="bullets">
          <li>
            <M>{S.d}</M> can be negative, when the common normal lies below <M>{S.Op}</M>.
          </li>
          <li>
            <M>{t`R_z`}</M> and <M>{t`T_z`}</M> act along the same axis, so their order doesn't matter. Together they
            form one screw motion along <M>{S.zp}</M>.
          </li>
        </ul>
      </>
    ),
  },

  {
    id: 'a',
    short: 'a length',
    color: C.a,
    title: (
      <>
        <M>{S.a}</M> link length
      </>
    ),
    focus: 'a',
    seq: [2, 3],
    render: (ctx) => (
      <>
        <p>
          <M>{S.a}</M> is the length of the <b>common normal</b>, the shortest line between the joint axes{' '}
          <M>{S.zp}</M> and <M>{S.zj}</M>. It is measured <b>along</b> <M>{S.xj}</M>, which lies on that common
          normal.
        </p>
        <ParamSlider param="a" value={ctx.p.a} onChange={(v) => ctx.setParam('a', v)} />
        <div className="actions">
          <PlayButton ctx={ctx} from={2} to={3}>
            Play <M>{t`T_x(a_j)`}</M>
          </PlayButton>
        </div>
        <div className="math">
          <Tex block>{TX_SYM}</Tex>
          <Numeric label={t`T_x(${fmtNum(ctx.p.a, 2)})`} T={Tx(ctx.p.a)} />
        </div>
        <ul className="bullets">
          <li>
            <M>{t`a_j = 0`}</M> exactly when the two joint axes <b>intersect</b>, as in every joint of a spherical wrist.
          </li>
          <li>
            The name can mislead: <M>{S.a}</M> is not the length of the metal part. Only the distance between the two
            axes counts.
          </li>
          <li>
            It is <b>always a constant</b>, whatever the joint type. By convention <M>{t`a_j \ge 0`}</M>.
          </li>
        </ul>
      </>
    ),
  },

  {
    id: 'alpha',
    short: 'α twist',
    color: C.alpha,
    title: (
      <>
        <M>{S.al}</M> link twist
      </>
    ),
    focus: 'alpha',
    seq: [3, 4],
    render: (ctx) => (
      <>
        <p>
          <M>{S.al}</M> is the angle <b>from</b> <M>{S.zp}</M> <b>to</b> <M>{S.zj}</M>, measured <b>about</b>{' '}
          <M>{S.xj}</M> (right-hand rule again). It sets the direction of the <b>next joint axis</b> relative to this
          one.
        </p>
        <ParamSlider param="alpha" value={ctx.p.alpha} onChange={(v) => ctx.setParam('alpha', v)} />
        <div className="quick">
          {[0, 90, -90, 180].map((deg) => (
            <button key={deg} type="button" className="chip" onClick={() => ctx.tweenP({ alpha: toRad(deg) })}>
              {deg > 0 ? '+' : ''}
              {deg}°
            </button>
          ))}
          <PlayButton ctx={ctx} from={3} to={4}>
            Play <M>{t`R_x(\alpha_j)`}</M>
          </PlayButton>
        </div>
        <table className="mini-table">
          <thead>
            <tr>
              <th>
                <M>{S.al}</M>
              </th>
              <th>Next axis is…</th>
              <th>Typical use</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>0°</td>
              <td>parallel</td>
              <td>planar arms: shoulder → elbow</td>
            </tr>
            <tr>
              <td>±90°</td>
              <td>perpendicular</td>
              <td>waist → shoulder, wrist joints</td>
            </tr>
            <tr>
              <td>180°</td>
              <td>anti-parallel</td>
              <td>SCARA: flips z to point down</td>
            </tr>
          </tbody>
        </table>
        <div className="math">
          <Tex block>{RX_SYM}</Tex>
          <Numeric label={t`R_x(${fmtNum(toDeg(ctx.p.alpha), 0)}^\circ)`} T={Rx(ctx.p.alpha)} />
        </div>
        <p>
          Like <M>{S.a}</M>, the twist is <b>always a constant</b>: it is built into the shape of the link.{' '}
          <M>{t`T_x`}</M> and <M>{t`R_x`}</M> share an axis too, so they form a second screw motion, this one along{' '}
          <M>{S.xj}</M>.
        </p>
      </>
    ),
  },

  {
    id: 'full',
    short: 'Full transform',
    title: 'The complete link transform',
    focus: 'all',
    seq: [0, 4],
    render: (ctx) => {
      const { p } = ctx;
      const R = p.type === 'R';
      return (
        <>
          <p>Multiplying the four elementary transforms gives one homogeneous matrix:</p>
          <div className="math">
            <Tex block>{A_SYM}</Tex>
          </div>
          <p className="note">
            Here <M>c</M> = cos and <M>s</M> = sin. The last column is the position of <M>{S.Oj}</M> in{' '}
            <M>{S.Fp}</M>. The first three columns are the directions of <M>{t`x_j, y_j, z_j`}</M>.
          </p>
          <ParamSlider param="theta" value={p.theta} onChange={(v) => ctx.setParam('theta', v)} variable={R} />
          <ParamSlider param="d" value={p.d} onChange={(v) => ctx.setParam('d', v)} variable={!R} />
          <ParamSlider param="a" value={p.a} onChange={(v) => ctx.setParam('a', v)} />
          <ParamSlider param="alpha" value={p.alpha} onChange={(v) => ctx.setParam('alpha', v)} />
          <div className="math">
            <Numeric label={t`{}^{j-1}\!A_j`} T={linkStd(p)} />
          </div>
          <h4>The same link in the Robotics Toolbox</h4>
          <CodeBlock title="MATLAB · RTB 10" lang="matlab" code={singleLinkCode(p, 'matlab')} />
          <CodeBlock title="Python · roboticstoolbox-python" lang="python" code={singleLinkCode(p, 'python')} />
        </>
      );
    },
  },

  {
    id: 'practice',
    short: 'Practice',
    title: 'Practice: match the target',
    focus: 'all',
    render: (ctx) => {
      const { user, target, solved, hint, revealed } = ctx.practice;
      const cmp = compare(user, target);
      const hintText = hint && HINTS[hint.key](hint.more);
      return (
        <>
          <p>
            A faded <b>target</b> frame <M>{S.Fj}</M> appears in the 3D view. Find the <M>{S.th}</M>, <M>{S.d}</M>,{' '}
            <M>{S.a}</M> and <M>{S.al}</M> that put your frame <M>{S.Fj}</M> exactly on it.
          </p>
          <p className="note">
            Tip: work in the order of the link transform. Get <M>{S.xj}</M> pointing the right way with θ, raise it with
            d, reach out with a, then twist <M>{S.zj}</M> into place with α.
          </p>
          {['theta', 'd', 'a', 'alpha'].map((k) => (
            <div key={k} className={`practice-row${cmp.ok[k] ? ' ok' : ''}`}>
              <ParamSlider
                param={k}
                value={user[k]}
                onChange={(v) => ctx.setUser(k, v)}
                step={k === 'theta' || k === 'alpha' ? 5 : 0.05}
                min={k === 'd' ? -0.4 : k === 'a' ? 0 : undefined}
                max={k === 'd' || k === 'a' ? 1.2 : undefined}
              />
              <span className="practice-mark" aria-label={cmp.ok[k] ? 'correct' : 'not yet'}>
                {cmp.ok[k] ? <Icon name="check" size={16} /> : null}
              </span>
            </div>
          ))}
          {cmp.all ? (
            <Callout tone="ok" title={revealed ? 'Here is the answer' : 'Matched!'}>
              <M>{t`\theta_j = ${fmtNum(toDeg(target.theta), 0)}^\circ,\ d_j = ${fmtNum(target.d, 2)},\ a_j = ${fmtNum(target.a, 2)},\ \alpha_j = ${fmtNum(toDeg(target.alpha), 0)}^\circ`}</M>
              <div className="actions">
                <button type="button" className="btn sm primary" onClick={ctx.newTarget}>
                  <Icon name="shuffle" size={14} /> Next target
                </button>
              </div>
            </Callout>
          ) : (
            hintText && <Callout tone="hint" title="Hint">{hintText}</Callout>
          )}
          <div className="actions">
            <button type="button" className="btn sm" onClick={ctx.showHint} disabled={cmp.all}>
              <Icon name="bulb" size={14} /> Hint
            </button>
            <button type="button" className="btn sm" onClick={ctx.reveal} disabled={cmp.all}>
              <Icon name="eye" size={14} /> Reveal
            </button>
            <button type="button" className="btn sm" onClick={ctx.newTarget}>
              <Icon name="shuffle" size={14} /> New target
            </button>
            <span className="score">
              Solved: <b>{solved}</b>
            </span>
          </div>
        </>
      );
    },
  },
];

const HINTS = {
  theta: (more) => (
    <>
      Start with <M>{S.th}</M>. {more ? 'Increase' : 'Decrease'} it (rotate about <M>{S.zp}</M>) until your{' '}
      <M>{S.xj}</M> points the same way as the target's red x-axis.
    </>
  ),
  d: (more) => (
    <>
      θ is right. Now <M>{S.d}</M>: the target's x-axis crosses <M>{S.zp}</M> {more ? 'higher up' : 'lower down'}, so{' '}
      {more ? 'increase' : 'decrease'} d.
    </>
  ),
  a: (more) => (
    <>
      θ and d are right. The target origin is {more ? 'farther from' : 'closer to'} the <M>{S.zp}</M> axis, so{' '}
      {more ? 'increase' : 'decrease'} <M>{S.a}</M>.
    </>
  ),
  alpha: (more) => (
    <>
      Almost there. {more ? 'Increase' : 'Decrease'} <M>{S.al}</M> to twist about <M>{S.xj}</M> until your blue{' '}
      <M>{S.zj}</M> matches the target's z-axis.
    </>
  ),
};
