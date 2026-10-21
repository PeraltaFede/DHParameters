import { useEffect, useState } from 'react';
import BuilderTab from './builder/BuilderTab.jsx';
import { jointFromLink, useRobotState } from './builder/robotState.js';
import { BrandMark, Icon } from './components/Icons.jsx';
import { useExamState } from './exam/examState.js';
import ExamTab from './exam/ExamTab.jsx';
import LearnTab from './learn/LearnTab.jsx';
import { ThemeContext, useThemeState } from './theme.js';

const TABS = [
  { id: 'learn', num: 1, label: 'Learn one joint' },
  { id: 'builder', num: 2, label: 'Robot builder' },
  { id: 'exam', num: 3, label: 'Robot exam' },
];

function stored(key, allowed, fallback) {
  try {
    const v = localStorage.getItem(key);
    return allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [theme, setTheme] = useThemeState();
  const [tab, setTab] = useState(() => stored('dh-tab', TABS.map((t) => t.id), 'learn'));
  const [builderView, setBuilderView] = useState(() => stored('dh-builder-view', ['build', 'practice'], 'build'));
  const [robot, setRobot] = useRobotState();
  const [exam, examActions] = useExamState();

  // While an exam is in progress (a student ID is set), the exam is the only tab there is.
  const locked = exam.id !== '';
  const current = locked ? 'exam' : tab;
  const tabs = locked ? TABS.filter((t) => t.id === 'exam') : TABS;
  // ...and stays the open tab when the exam is cleared.
  useEffect(() => {
    if (locked) setTab('exam');
  }, [locked]);

  useEffect(() => {
    try {
      localStorage.setItem('dh-tab', tab);
      localStorage.setItem('dh-builder-view', builderView);
    } catch {
      /* storage unavailable */
    }
  }, [tab, builderView]);


  return (
    <ThemeContext.Provider value={theme}>
      <div className="app">
        <header className="topbar">
          <div className="topbar-inner">
            <div className="brand">
              <BrandMark />
              <div>
                <div className="brand-title">DH Parameters</div>
                <div className="brand-sub">Denavit–Hartenberg for Robotics @ ULA</div>
              </div>
            </div>
            <nav className="tabs" role="tablist" aria-label="Sections">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={current === t.id}
                  className="tab"
                  onClick={() => setTab(t.id)}
                >
                  <span className="tab-num">{t.num}</span>
                  {t.label}
                </button>
              ))}
            </nav>
            <button
              type="button"
              className="icon-btn theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
            </button>
          </div>
        </header>

        <main className="main">
          {!locked && <LearnTab active={current === 'learn'} />}
          {!locked && (
            <BuilderTab
              active={current === 'builder'}
              robot={robot}
              setRobot={setRobot}
              view={builderView}
              setView={setBuilderView}
            />
          )}
          <ExamTab active={current === 'exam'} exam={exam} actions={examActions} />
        </main>

        <footer className="footer">
          Standard DH as in P. Corke, <i>Robotics, Vision and Control</i>. Generated code targets the Robotics Toolbox
          for MATLAB (RTB 10) and roboticstoolbox-python. Made by Federico Peralta for Robotics course @ Universidad
          Loyola Andalucía
        </footer>
      </div>
    </ThemeContext.Provider>
  );
}
