import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import { darkColors, lightColors, type ColorPalette } from './theme';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'theme-mode';

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ColorPalette;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  colors: darkColors,
  setMode: () => {},
});

/** The theme-aware color palette for the current screen. */
export function useColors() {
  return useContext(ThemeContext).colors;
}

/** Current mode + setter, for the Ajustes screen's light/dark toggle. */
export function useThemeMode() {
  const { mode, setMode } = useContext(ThemeContext);
  return { mode, setMode };
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') setModeState(stored);
    });
  }, []);

  function setMode(next: ThemeMode) {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch((err) => console.error('[theme]', err));
  }

  const colors = mode === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, setMode }}>{children}</ThemeContext.Provider>
  );
}
