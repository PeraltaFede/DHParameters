import { useEffect, useState } from 'react';
import BuilderTab from './builder/BuilderTab.jsx';
import { jointFromLink, useRobotState } from './builder/robotState.js';
import { BrandMark, Icon } from './components/Icons.jsx';
import LearnTab from './learn/LearnTab.jsx';
import { ThemeContext, useThemeState } from './theme.js';

const TABS = [
  { id: 'learn', label: 'Learn one joint' },
  { id: 'builder', label: 'Robot builder' },
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
  const [tab, setTab] = useState(() => stored('dh-tab', ['learn', 'builder'], 'learn'));
  const [builderView, setBuilderView] = useState(() => stored('dh-builder-view', ['build', 'practice'], 'build'));
  const [robot, setRobot] = useRobotState();

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
              {TABS.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className="tab"
                  onClick={() => setTab(t.id)}
                >
                  <span className="tab-num">{i + 1}</span>
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
          <LearnTab active={tab === 'learn'} />
          <BuilderTab
            active={tab === 'builder'}
            robot={robot}
            setRobot={setRobot}
            view={builderView}
            setView={setBuilderView}
          />
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
