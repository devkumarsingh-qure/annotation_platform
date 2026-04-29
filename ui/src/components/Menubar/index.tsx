import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { UI_PATHS } from "../../utils/urls";
import Profile from "./Profile";
import Upload from "./Upload";

const THEME_STORAGE_KEY = "theme";

function Menubar({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const [isDarkTheme, setIsDarkTheme] = useState(() => {
        try {
            return localStorage.getItem(THEME_STORAGE_KEY) === "dark";
        } catch {
            return document.body.dataset.theme === "dark";
        }
    });

    useEffect(() => {
        const theme = isDarkTheme ? "dark" : "light";
        document.body.dataset.theme = theme;
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [isDarkTheme]);

    if (location.pathname === UI_PATHS.LOGIN()) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="relative z-30 shrink-0 flex items-center border-b border-[var(--border)] bg-[color:var(--surface)]/85 px-4 py-3 backdrop-blur-[12px]">
                <h1 className="space-x-1 text-[var(--text)]">
                    <span className="text-xl font-bold tracking-tight">
                        Annotation Platform
                    </span>
                    <span className="text-xs font-medium text-[var(--muted)]">
                        by Dev
                    </span>
                </h1>

                <div className="grow flex h-full items-center justify-end space-x-4">
                    <input
                        id="theme-toggle"
                        type="checkbox"
                        className="peer sr-only"
                        aria-label="Toggle dark theme"
                        checked={isDarkTheme}
                        onChange={(e) => setIsDarkTheme(e.target.checked)}
                    />
                    <label
                        htmlFor="theme-toggle"
                        title="Toggle light and dark theme"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] bg-[color:var(--surface-strong)]/80 px-2 py-1 text-xs font-semibold text-[var(--muted)] shadow-sm backdrop-blur-sm transition hover:text-[var(--text)] peer-checked:[&>span>span]:translate-x-4 peer-checked:[&>span>span]:from-indigo-200 peer-checked:[&>span>span]:to-indigo-400"
                    >
                        <span className="inline-flex h-5 w-9 items-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] p-0.5">
                            <span className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-white to-indigo-100 shadow transition-transform duration-200" />
                        </span>
                        <span>Theme</span>
                    </label>
                    <Upload />
                    <Profile />
                </div>

            </div>
            <div className="flex-1 min-h-0">
                {children}
            </div>
        </div>
    );
}

export default Menubar;