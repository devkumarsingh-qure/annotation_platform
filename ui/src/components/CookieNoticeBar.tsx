import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { UI_PATHS } from "../utils/urls";

const SESSION_DISMISS_KEY = "annotation_platform_cookie_notice_session";

function isLoginRoute(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized === UI_PATHS.LOGIN();
}

/**
 * Browsers cannot grant cookie permission from script; this bar explains that
 * essential session cookies must be allowed (often blocked in strict /
 * incognito modes or when the API is on another origin).
 */
function CookieNoticeBar() {
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(SESSION_DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, [pathname]);

  if (!isLoginRoute(pathname) || dismissed) {
    return null;
  }

  const dismiss = () => {
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div
      className="fixed inset-x-0 top-0 z-[200] border-b border-[color-mix(in_srgb,var(--warning)_42%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_14%,var(--surface))] px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6"
      role="region"
      aria-label="Cookies required for sign-in"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1 pt-0.5">
          <p className="text-sm font-semibold text-[var(--text)]">
            Allow cookies to sign in
          </p>
          <p className="text-xs leading-relaxed text-[var(--muted)]">
            Sign-in uses essential cookies to keep your session. If your browser
            blocks cookies (strict privacy, incognito, or blocked third-party
            cookies when the API is on another domain), login may fail with
            errors about cookies in the developer console. Use your
            browser&apos;s site settings to allow cookies for this app (and the
            API origin if it differs).
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg border border-[color-mix(in_srgb,var(--warning)_45%,var(--border))] bg-[color:var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export default CookieNoticeBar;
