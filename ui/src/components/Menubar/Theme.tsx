import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "../../utils/constants";
import MoonIcon from "../../icons/MoonIcon";
import SunIcon from "../../icons/SunIcon";

const THEME_CHANGE_EVENT = "annotation-platform-theme-change";

type ThemeProps = {
  variant?: "toolbar" | "menu";
  id?: string;
  onToggle?: () => void;
};

function readIsDarkTheme() {
  try {
    if (typeof window !== "undefined") {
      return localStorage.getItem(THEME_STORAGE_KEY) === "dark";
    }
  } catch {
    // Fall back to the applied document theme when storage is unavailable.
  }

  if (typeof document !== "undefined") {
    return document.body.dataset.theme === "dark";
  }

  return false;
}

function writeTheme(isDarkTheme: boolean) {
  const theme = isDarkTheme ? "dark" : "light";

  if (typeof document !== "undefined") {
    document.body.dataset.theme = theme;
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures; the DOM theme still updates.
  }
}

function Theme({
  variant = "toolbar",
  id = "theme-toggle",
  onToggle,
}: ThemeProps) {
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return readIsDarkTheme();
  });

  useEffect(() => {
    writeTheme(isDarkTheme);
  }, [isDarkTheme]);

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const theme = (event as CustomEvent<string>).detail;

      if (theme === "dark" || theme === "light") {
        setIsDarkTheme(theme === "dark");
        return;
      }

      setIsDarkTheme(readIsDarkTheme());
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        setIsDarkTheme(event.newValue === "dark");
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const updateTheme = (nextIsDarkTheme: boolean) => {
    const nextTheme = nextIsDarkTheme ? "dark" : "light";

    writeTheme(nextIsDarkTheme);
    setIsDarkTheme(nextIsDarkTheme);
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGE_EVENT, { detail: nextTheme }),
    );
    onToggle?.();
  };

  if (variant === "menu") {
    return (
      <div className="p-1 sm:hidden">
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
          role="menuitem"
          onClick={() => updateTheme(!isDarkTheme)}
        >
          <span className="flex min-w-0 items-center gap-2.5">
            {!isDarkTheme ? (
              <SunIcon className="size-5 shrink-0" />
            ) : (
              <MoonIcon className="size-5 shrink-0" />
            )}
            <span className="sr-only">Theme</span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-[var(--text)]">
            {isDarkTheme ? "Dark" : "Light"}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        aria-label="Toggle dark theme"
        checked={isDarkTheme}
        onChange={(e) => updateTheme(e.target.checked)}
      />
      <label
        htmlFor={id}
        title="Toggle light and dark theme"
        className="inline-flex min-h-10 cursor-pointer items-center gap-2.5 rounded-full border border-[var(--border)] bg-[color:var(--surface-strong)]/80 px-2.5 py-1.5 pr-3 text-xs font-semibold text-[var(--muted)] shadow-sm backdrop-blur-sm transition hover:text-[var(--text)] peer-checked:[&>span>span]:translate-x-4 peer-checked:[&>span>span]:from-indigo-200 peer-checked:[&>span>span]:to-indigo-400"
      >
        <span className="inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] p-0.5">
          <span className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-white to-indigo-100 shadow transition-transform duration-200" />
        </span>
        {!isDarkTheme ? (
          <SunIcon className="size-[1.125rem] shrink-0" />
        ) : (
          <MoonIcon className="size-[1.125rem] shrink-0" />
        )}
      </label>
    </div>
  );
}

export default Theme;
