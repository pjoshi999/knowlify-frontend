import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  setSystemTheme: (theme: ResolvedTheme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      resolvedTheme: "dark",
      systemTheme: "dark",
      setTheme: (theme) => {
        const state = get();
        const resolvedTheme = theme === "system" ? state.systemTheme : theme;
        set({ theme, resolvedTheme });
      },
      setSystemTheme: (systemTheme) => {
        const state = get();
        const resolvedTheme = state.theme === "system" ? systemTheme : state.resolvedTheme;
        set({ systemTheme, resolvedTheme });
      },
      toggleTheme: () => {
        const state = get();
        const newTheme = state.resolvedTheme === "light" ? "dark" : "light";
        set({ theme: newTheme, resolvedTheme: newTheme });
      },
    }),
    {
      name: "theme-storage",
    }
  )
);
