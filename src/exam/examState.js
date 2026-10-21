import { useEffect, useState } from 'react';
import { DIR_KEYS } from '../lib/examRobot.js';

const KEY = 'dh-exam-v1';
export const TABLE_KEYS = ['sigma', 'theta', 'd', 'a', 'alpha'];
export const EXERCISE_IDS = ['ex1', 'ex2'];
export const MAX_SEGMENTS = 4;

const blankTable = () => Array.from({ length: 3 }, () => Object.fromEntries(TABLE_KEYS.map((k) => [k, ''])));
const blankSegment = () => ({ dir: null, len: '' });

/** Exercise 1 before the student touches it: no axes, an empty DH table, no code. */
const blankEx1 = () => ({
  frames: Array.from({ length: 4 }, () => ({ z: null, x: null })),
  table: blankTable(),
  code: '',
});
/** Exercise 2: an empty DH table, frames with no origin or axes, joints with no axis and one empty segment per link. */
const blankEx2 = () => ({
  table: blankTable(),
  frames: Array.from({ length: 4 }, () => ({ o: ['', '', ''], z: null, x: null })),
  robot: Array.from({ length: 3 }, () => ({ axis: null, links: [blankSegment()] })),
});
const blank = () => ({ id: '', current: 'ex1', ex1: blankEx1(), ex2: blankEx2() });

/** What the student ID field keeps of the typed text: digits only. */
export const idDigits = (text) => String(text).replace(/\D/g, '');

const isDir = (v) => v === null || DIR_KEYS.includes(v);
const isText = (v) => typeof v === 'string';
const isTable = (t) => Array.isArray(t) && t.length === 3 && t.every((r) => r && TABLE_KEYS.every((k) => isText(r[k])));
const isFrames = (fs, withOrigin) =>
  Array.isArray(fs) &&
  fs.length === 4 &&
  fs.every((f) => f && isDir(f.z) && isDir(f.x) && (!withOrigin || (Array.isArray(f.o) && f.o.length === 3 && f.o.every(isText))));
const isEx1 = (ex) => Boolean(ex) && isFrames(ex.frames, false) && isTable(ex.table) && isText(ex.code);
const isEx2 = (ex) =>
  Boolean(ex) &&
  isTable(ex.table) &&
  isFrames(ex.frames, true) &&
  Array.isArray(ex.robot) &&
  ex.robot.length === 3 &&
  ex.robot.every(
    (j) => j && isDir(j.axis) && Array.isArray(j.links) && j.links.length <= MAX_SEGMENTS && j.links.every((sg) => sg && isDir(sg.dir) && isText(sg.len)),
  );

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && isText(s.id) && /^\d*$/.test(s.id) && isEx1(s.ex1)) {
      // A save from before Exercise 2 existed keeps its Exercise 1 answers.
      return {
        id: s.id,
        current: EXERCISE_IDS.includes(s.current) ? s.current : 'ex1',
        ex1: s.ex1,
        ex2: isEx2(s.ex2) ? s.ex2 : blankEx2(),
      };
    }
  } catch {
    /* storage unavailable or corrupt */
  }
  return blank();
}

function save(s) {
  try {
    const json = JSON.stringify(s);
    if (localStorage.getItem(KEY) !== json) localStorage.setItem(KEY, json);
  } catch {
    /* storage unavailable */
  }
}

const mapAt = (list, i, fn) => list.map((x, k) => (k === i ? fn(x) : x));

/**
 * The exam in progress, remembered in this browser: the student ID ('' = not started), the
 * exercise on screen and the answers to both. The robots are never stored; they are rebuilt from
 * the ID. Other open tabs of the app follow along through the storage event, so starting the
 * exam locks them too.
 */
export function useExamState() {
  const [state, setState] = useState(load);

  useEffect(() => save(state), [state]);
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY || e.key === null) setState(load());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const patchEx = (exId, fn) => setState((s) => ({ ...s, [exId]: fn(s[exId]) }));
  const patchFrame = (exId, k, fn) => patchEx(exId, (ex) => ({ ...ex, frames: mapAt(ex.frames, k, fn) }));
  const patchJoint = (j, fn) => patchEx('ex2', (ex) => ({ ...ex, robot: mapAt(ex.robot, j, fn) }));

  const actions = {
    start: (text) => {
      const id = idDigits(text);
      if (id) setState({ ...blank(), id });
    },
    clear: () => setState(blank()),
    setCurrent: (current) => setState((s) => ({ ...s, current })),
    setCell: (exId, row, key, text) => patchEx(exId, (ex) => ({ ...ex, table: mapAt(ex.table, row, (r) => ({ ...r, [key]: text })) })),
    setAxis: (exId, k, which, dir) => patchFrame(exId, k, (f) => ({ ...f, [which]: dir })),
    setOrigin: (k, c, text) => patchFrame('ex2', k, (f) => ({ ...f, o: mapAt(f.o, c, () => text) })),
    setCode: (code) => patchEx('ex1', (ex) => ({ ...ex, code })),
    setJointAxis: (j, axis) => patchJoint(j, (joint) => ({ ...joint, axis })),
    setSegment: (j, i, patch) => patchJoint(j, (joint) => ({ ...joint, links: mapAt(joint.links, i, (sg) => ({ ...sg, ...patch })) })),
    addSegment: (j) =>
      patchJoint(j, (joint) => (joint.links.length < MAX_SEGMENTS ? { ...joint, links: [...joint.links, blankSegment()] } : joint)),
    removeSegment: (j, i) => patchJoint(j, (joint) => ({ ...joint, links: joint.links.filter((_, k) => k !== i) })),
  };

  return [state, actions];
}
