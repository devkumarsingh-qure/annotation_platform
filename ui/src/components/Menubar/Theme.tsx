import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "../../utils/constants";
import MoonIcon from "../../icons/MoonIcon";
import SunIcon from "../../icons/SunIcon";

function Theme() {
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

    return (
        <div>
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
                className="inline-flex cursor-pointer py-1 px-1 pr-2 items-center gap-2 rounded-full border border-[var(--border)] bg-[color:var(--surface-strong)]/80 text-xs font-semibold text-[var(--muted)] shadow-sm backdrop-blur-sm transition hover:text-[var(--text)] peer-checked:[&>span>span]:translate-x-4 peer-checked:[&>span>span]:from-indigo-200 peer-checked:[&>span>span]:to-indigo-400"
            >
                <span className="inline-flex h-5 w-9 items-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] p-0.5">
                    <span className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-white to-indigo-100 shadow transition-transform duration-200" />
                </span>
                {!isDarkTheme ? <SunIcon className="size-4 shrink-0" /> : <MoonIcon className="size-4 shrink-0" />}
            </label>
        </div>
    )
}

export default Theme;