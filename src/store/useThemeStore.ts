import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,

  toggleTheme: async () => {
    const next = !get().isDark;
    set({ isDark: next });
    await AsyncStorage.setItem('theme', next ? 'dark' : 'light');
  },

  loadTheme: async () => {
    const stored = await AsyncStorage.getItem('theme');
    if (stored === 'dark') set({ isDark: true });
  },
}));
