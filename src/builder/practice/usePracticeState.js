import { useEffect, useState } from 'react';
import { checkModel, makeExercise, solution, studentStart, TEMPLATES } from '../../lib/exercises.js';
import { DEFAULT_OPTS, withType } from '../robotState.js';

const KEY = 'dh-practice-v1';
const PROGRESS_KEY = 'dh-practice-progress-v1';

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

function fresh(level, templateId, prev = {}) {
  const exercise = makeExercise(level, templateId);
  return {
    level,
    templateId,
    units: prev.units ?? 'deg',
    opts: prev.opts ?? { ...DEFAULT_OPTS },
    exercise,
    student: studentStart(exercise),
    hints: 0,
    revealed: false,
    lastCheck: null, // { stamp, result } from the last "Check model"
    solved: false,
  };
}

function isValid(s) {
  const ex = s?.exercise;
  return (
    s &&
    [1, 2, 3].includes(s.level) &&
    (s.templateId === 'random' || TEMPLATES.some((t) => t.id === s.templateId)) &&
    Array.isArray(ex?.truth) &&
    Array.isArray(ex?.target) &&
    Array.isArray(s.student?.joints) &&
    s.student.joints.length === ex.truth.length &&
    Array.isArray(s.student?.q)
  );
}

/** A fingerprint of the student's table, to know whether the last check is still current. */
export const tableStamp = (joints) => JSON.stringify(joints.map((j) => [j.type, j.theta, j.d, j.a, j.alpha, j.offset]));

const emptyProgress = () => ({ 1: {}, 2: {}, 3: {} });

/** Practice state and progress, both remembered in this browser. */
export function usePracticeState() {
  const [state, setState] = useState(() => {
    const saved = read(KEY);
    return isValid(saved) ? saved : fresh(1, 'random');
  });
  const [progress, setProgress] = useState(() => ({ ...emptyProgress(), ...(read(PROGRESS_KEY) ?? {}) }));

  useEffect(() => write(KEY, state), [state]);
  useEffect(() => write(PROGRESS_KEY, progress), [progress]);

  const patch = (p) => setState((s) => ({ ...s, ...p }));
  const patchStudent = (fn) => setState((s) => ({ ...s, student: fn(s.student) }));

  const actions = {
    newExercise: (level = state.level, templateId = state.templateId) => setState((s) => fresh(level, templateId, s)),
    setUnits: (units) => patch({ units }),
    setOpts: (p) => setState((s) => ({ ...s, opts: { ...s.opts, ...p } })),
    updateJoint: (id, p) => patchStudent((st) => ({ ...st, joints: st.joints.map((j) => (j.id === id ? { ...j, ...p } : j)) })),
    changeType: (id, type) =>
      patchStudent((st) => ({
        ...st,
        joints: st.joints.map((j, i) => {
          if (j.id !== id) return j;
          const next = withType(j, type);
          // Joint limits are given data: keep the real ones when the type is right.
          const t = state.exercise.truth[i];
          return t.type === type ? { ...next, qlim: [...t.qlim] } : next;
        }),
      })),
    setQ: (i, v) => patchStudent((st) => ({ ...st, q: st.q.map((x, k) => (k === i ? v : x)) })),
    resetQ: () => patchStudent((st) => ({ ...st, q: [...state.exercise.qRef] })),
    check: () =>
      setState((s) => ({
        ...s,
        lastCheck: { stamp: tableStamp(s.student.joints), result: checkModel(s.exercise, s.student.joints) },
      })),
    hint: () => setState((s) => ({ ...s, hints: s.hints + 1 })),
    reveal: () =>
      setState((s) => {
        const student = solution(s.exercise);
        return {
          ...s,
          student,
          revealed: true,
          lastCheck: { stamp: tableStamp(student.joints), result: checkModel(s.exercise, student.joints) },
        };
      }),
    /** Mark the exercise solved; it counts once, and only if the answer wasn't revealed. */
    markSolved: () => {
      if (state.solved) return;
      patch({ solved: true });
      if (!state.revealed) {
        const { level, exercise } = state;
        setProgress((p) => ({
          ...p,
          [level]: { ...p[level], [exercise.templateId]: (p[level]?.[exercise.templateId] ?? 0) + 1 },
        }));
      }
    },
    resetHints: () => patch({ hints: 0 }),
  };

  return [state, progress, actions];
}
