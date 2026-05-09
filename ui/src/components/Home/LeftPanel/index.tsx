import { useContext, useEffect, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import { UI_PATHS } from "../../../utils/urls";
import { AuthContext } from "../../../contexts/auth/authContext";
import FolderIcon from "../../../icons/FolderIcon";
import UserGroupIcon from "../../../icons/UserGroupIcon";
import ClipboardListIcon from "../../../icons/ClipboardListIcon";
import XIcon from "../../../icons/XIcon";

type TabItem = {
  label: string;
  path: string;
  Icon: ComponentType<{ className: string }>;
};

const TABS: TabItem[] = [
  { label: "Projects", path: UI_PATHS.PROJECTS(), Icon: FolderIcon },
  { label: "Patients", path: UI_PATHS.PATIENTS(), Icon: ClipboardListIcon },
  { label: "Members", path: UI_PATHS.USERS(), Icon: UserGroupIcon },
];

function closeMobileNavigation(setIsMobileNavOpen: (open: boolean) => void) {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  setIsMobileNavOpen(false);
}

function isTabActive(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function MobileWorkspaceNavigation() {
  const { user } = useContext(AuthContext);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isMobileNavOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileNavigation(setIsMobileNavOpen);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileNavOpen]);

  if (!user) {
    return null;
  }

  const visibleTabs = TABS.filter(
    (tab) => user.is_workspace_admin || tab.label !== "Members",
  );
  const pathname =
    typeof window === "undefined" ? "" : window.location.pathname;
  const activeTab =
    visibleTabs.find((tab) => isTabActive(pathname, tab.path)) ??
    visibleTabs[0];
  const ActiveIcon = activeTab?.Icon ?? FolderIcon;
  const overlay =
    isMobileNavOpen && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[1000] flex bg-black/45 backdrop-blur-[2px] transition-colors md:hidden">
            <div className="h-full w-[82vw] max-w-xs min-w-0 bg-[var(--surface)]/95 shadow-2xl backdrop-blur-[12px] transition-transform duration-200 ease-out">
              <nav
                className="flex h-full min-h-0 flex-col overflow-hidden border-r border-[var(--border)]"
                aria-label="Workspace sections"
              >
                <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--border)] px-3">
                  <h2 className="min-w-0 flex-1 truncate font-semibold tracking-tight text-[var(--text)]">
                    Workspace
                  </h2>
                  <button
                    type="button"
                    onClick={() => closeMobileNavigation(setIsMobileNavOpen)}
                    title="Close workspace navigation"
                    aria-label="Close workspace navigation"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)]/80 bg-[var(--surface-soft)] text-[var(--muted)] transition hover:border-[var(--danger)]/50 hover:bg-[var(--danger)]/10 hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
                  >
                    <XIcon className="size-4" />
                  </button>
                </header>

                <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
                  {visibleTabs.map((tab) => {
                    const Icon = tab.Icon;
                    return (
                      <li key={tab.path}>
                        <NavLink
                          to={tab.path}
                          end={false}
                          onClick={() =>
                            closeMobileNavigation(setIsMobileNavOpen)
                          }
                          className={({ isActive }) =>
                            [
                              "group flex min-w-0 items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition outline-none",
                              "focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[color-mix(in_srgb,var(--surface)_92%,transparent)]",
                              isActive
                                ? "border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[color-mix(in_srgb,var(--accent-soft)_65%,transparent)] font-semibold text-[var(--text)] shadow-[inset_3px_0_0_var(--accent)]"
                                : "border-transparent font-medium text-[var(--muted)] hover:border-[var(--border)]/80 hover:bg-[var(--surface-soft)] hover:text-[var(--text)]",
                            ].join(" ")
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <span
                                className={[
                                  "flex size-9 shrink-0 items-center justify-center rounded-lg border transition",
                                  isActive
                                    ? "border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] text-[var(--accent-strong)]"
                                    : "border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[color-mix(in_srgb,var(--surface-soft)_50%,transparent)] text-[var(--muted)] group-hover:border-[var(--border)] group-hover:text-[var(--accent)]",
                                ].join(" ")}
                              >
                                <Icon className="size-5" />
                              </span>
                              <span className="min-w-0 flex-1 truncate leading-snug">
                                {tab.label}
                              </span>
                            </>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>

            <button
              type="button"
              onClick={() => closeMobileNavigation(setIsMobileNavOpen)}
              aria-label="Close workspace navigation"
              className="min-w-0 flex-1 cursor-default"
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsMobileNavOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isMobileNavOpen}
        title={`Open ${activeTab?.label ?? "workspace"} navigation`}
        aria-label={`Open ${activeTab?.label ?? "workspace"} navigation`}
        className="flex size-10 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--border)_88%,transparent)] bg-[color-mix(in_srgb,var(--surface-strong)_82%,transparent)] text-[var(--accent-strong)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--surface-strong)_48%,transparent)] backdrop-blur-[12px] transition hover:bg-[var(--surface-soft)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
      >
        <ActiveIcon className="size-4 shrink-0" />
      </button>
      {overlay}
    </div>
  );
}

function LeftPanel() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return null;
  }

  const visibleTabs = TABS.filter(
    (tab) => user.is_workspace_admin || tab.label !== "Members",
  );

  return (
    <div className="hidden min-h-0 flex-col overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--border)_92%,transparent)] bg-[color-mix(in_srgb,var(--surface-strong)_55%,transparent)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--surface-strong)_48%,transparent),0_1px_0_color-mix(in_srgb,var(--border)_55%,transparent),0_22px_60px_-36px_color-mix(in_srgb,var(--accent)_18%,transparent)] backdrop-blur-[12px] md:flex md:h-full lg:divide-y lg:divide-[color-mix(in_srgb,var(--border)_72%,transparent)]">
        <div className="hidden shrink-0 border-t border-[color-mix(in_srgb,var(--border)_48%,transparent)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--accent-soft)_40%,transparent)_0%,color-mix(in_srgb,var(--surface-soft)_32%,transparent)_55%,transparent_100%)] p-4 lg:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Signed in
          </p>
          <p
            className="mt-1 truncate font-mono text-xs font-medium text-[var(--text)]"
            title={user.email}
          >
            {user.username}
          </p>
          <p className="mt-1 truncate font-mono text-[10px] text-[var(--muted)] leading-tight">
            {user.email}
          </p>
        </div>
        <nav
          className="relative flex min-h-0 flex-col bg-[color-mix(in_srgb,var(--surface)_65%,transparent)] md:h-full"
          aria-label="Workspace sections"
        >
          <p className="hidden px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)] lg:block">
            Workspace
          </p>
          <ul className="flex min-w-0 gap-1 p-1 md:min-h-0 md:flex-1 md:flex-col md:gap-1 md:overflow-y-auto md:p-3 md:pt-3 lg:pt-2">
            {visibleTabs.map((tab) => {
              const Icon = tab.Icon;

              return (
                <li key={tab.path} className="min-w-0 flex-1 md:flex-none">
                  <NavLink
                    to={tab.path}
                    end={false}
                    className={({ isActive }) =>
                      [
                        "group relative flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-md px-2 text-center text-[11px] transition outline-none md:h-auto md:w-full md:justify-start md:gap-3 md:rounded-xl md:px-3 md:py-3 md:text-left md:text-sm",
                        "focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 focus-visible:ring-offset-1 focus-visible:ring-offset-[color-mix(in_srgb,var(--surface)_92%,transparent)] md:focus-visible:ring-offset-2",
                        isActive
                          ? "border border-[color-mix(in_srgb,var(--accent)_30%,var(--border))] bg-[color-mix(in_srgb,var(--accent-soft)_58%,transparent)] font-semibold text-[var(--text)] shadow-[inset_0_-2px_0_var(--accent)] md:shadow-[inset_3px_0_0_var(--accent)]"
                          : "border border-transparent font-medium text-[var(--muted)] hover:border-[var(--border)]/80 hover:bg-[var(--surface-soft)] hover:text-[var(--text)]",
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={[
                            "flex size-4 shrink-0 items-center justify-center transition md:size-9 md:rounded-lg md:border",
                            isActive
                              ? "text-[var(--accent-strong)] md:border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] md:bg-[color-mix(in_srgb,var(--surface)_92%,transparent)]"
                              : "text-[var(--muted)] group-hover:text-[var(--accent)] md:border-[color-mix(in_srgb,var(--border)_70%,transparent)] md:bg-[color-mix(in_srgb,var(--surface-soft)_50%,transparent)] md:group-hover:border-[var(--border)]",
                          ].join(" ")}
                        >
                          <Icon className="size-4 md:size-5" />
                        </span>
                        <span className="min-w-0 truncate leading-none md:flex-1 md:leading-snug">
                          {tab.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
  );
}

export default LeftPanel;
