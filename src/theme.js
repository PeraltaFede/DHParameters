import { createContext, useContext, useEffect, useState } from 'react';
import { SCENE_PALETTE } from './lib/colors.js';

export const ThemeContext = createContext('light');

export const useScenePalette = () => SCENE_PALETTE[useContext(ThemeContext)] ?? SCENE_PALETTE.light;

function initialTheme() {
  const set = document.documentElement.dataset.theme;
  if (set === 'light' || set === 'dark') return set;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useThemeState() {
  const [theme, setTheme] = useState(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('dh-theme', theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);
  return [theme, setTheme];
}
