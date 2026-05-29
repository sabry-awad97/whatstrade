import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
} from "next-themes";
import * as React from "react";
import { THEME_VALUES, type ThemeValue } from "@/config/constants";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

/**
 * Custom theme hook with type-safe theme values
 * Wraps next-themes useTheme with our application constants
 *
 * @example
 * ```tsx
 * const { theme, setTheme, isDark } = useTheme();
 *
 * // Type-safe theme setting
 * setTheme(THEME_VALUES.DARK);
 *
 * // Check if dark mode
 * if (isDark) {
 *   // ...
 * }
 * ```
 */
export function useTheme() {
  const { theme, setTheme: setNextTheme, systemTheme } = useNextTheme();

  const setTheme = React.useCallback(
    (newTheme: ThemeValue) => {
      setNextTheme(newTheme);
    },
    [setNextTheme],
  );

  const isDark = React.useMemo(() => {
    const resolvedTheme = theme === THEME_VALUES.SYSTEM ? systemTheme : theme;
    return resolvedTheme === THEME_VALUES.DARK;
  }, [theme, systemTheme]);

  const isLight = React.useMemo(() => {
    const resolvedTheme = theme === THEME_VALUES.SYSTEM ? systemTheme : theme;
    return resolvedTheme === THEME_VALUES.LIGHT;
  }, [theme, systemTheme]);

  return {
    theme: theme as ThemeValue | undefined,
    setTheme,
    systemTheme: systemTheme as ThemeValue | undefined,
    isDark,
    isLight,
    THEME_VALUES,
  };
}
