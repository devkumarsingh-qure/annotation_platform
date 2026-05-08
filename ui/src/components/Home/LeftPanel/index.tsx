import { useContext, type ComponentType } from "react";
import { NavLink } from "react-router-dom";
import { UI_PATHS } from "../../../utils/urls";
import { AuthContext } from "../../../contexts/auth/authContext";
import FolderIcon from "../../../icons/FolderIcon";
import UserGroupIcon from "../../../icons/UserGroupIcon";
import ClipboardListIcon from "../../../icons/ClipboardListIcon";

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

function LeftPanel() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--border)_92%,transparent)] bg-[color-mix(in_srgb,var(--surface-strong)_55%,transparent)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--surface-strong)_48%,transparent),0_1px_0_color-mix(in_srgb,var(--border)_55%,transparent),0_22px_60px_-36px_color-mix(in_srgb,var(--accent)_18%,transparent)] backdrop-blur-[12px] md:h-full md:rounded-2xl lg:divide-y lg:divide-[color-mix(in_srgb,var(--border)_72%,transparent)]">
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
        <ul className="flex min-w-0 gap-2 overflow-x-auto p-2 md:min-h-0 md:flex-1 md:flex-col md:gap-1 md:overflow-y-auto md:p-3 md:pt-3 lg:pt-2">
          {TABS.map((tab) => {
            if (!user.is_workspace_admin && tab.label === "Members") {
              return null;
            }

            const Icon = tab.Icon;

            return (
              <li key={tab.path}>
                <NavLink
                  to={tab.path}
                  end={false}
                  className={({ isActive }) =>
                    [
                      "group relative flex min-w-[7rem] items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-sm transition outline-none md:min-w-0 md:w-full md:gap-3 md:rounded-xl md:px-3 md:py-3",
                      "focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[color-mix(in_srgb,var(--surface)_92%,transparent)]",
                      isActive
                        ? "border border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[color-mix(in_srgb,var(--accent-soft)_65%,transparent)] font-semibold text-[var(--text)] shadow-[inset_0_-3px_0_var(--accent)] md:shadow-[inset_3px_0_0_var(--accent)]"
                        : "border border-transparent font-medium text-[var(--muted)] hover:border-[var(--border)]/80 hover:bg-[var(--surface-soft)] hover:text-[var(--text)]",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={[
                          "flex size-8 shrink-0 items-center justify-center rounded-lg border transition md:size-9",
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
  );
}

export default LeftPanel;
