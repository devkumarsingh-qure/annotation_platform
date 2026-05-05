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
    <div className="flex h-full min-h-0 flex-col divide-y divide-[color-mix(in_srgb,var(--border)_72%,transparent)] overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--border)_92%,transparent)] bg-[color-mix(in_srgb,var(--surface-strong)_55%,transparent)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--surface-strong)_48%,transparent),0_1px_0_color-mix(in_srgb,var(--border)_55%,transparent),0_22px_60px_-36px_color-mix(in_srgb,var(--accent)_18%,transparent)] backdrop-blur-[12px]">
      <div className="shrink-0 border-t border-[color-mix(in_srgb,var(--border)_48%,transparent)] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--accent-soft)_40%,transparent)_0%,color-mix(in_srgb,var(--surface-soft)_32%,transparent)_55%,transparent_100%)] p-4">
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
        className="relative flex h-full min-h-0 flex-col bg-[color-mix(in_srgb,var(--surface)_65%,transparent)]"
        aria-label="Workspace sections"
      >
        <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
          Workspace
        </p>
        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3 pt-2">
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
                      "group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition outline-none",
                      "focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[color-mix(in_srgb,var(--surface)_92%,transparent)]",
                      isActive
                        ? "border border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[color-mix(in_srgb,var(--accent-soft)_65%,transparent)] font-semibold text-[var(--text)] shadow-[inset_3px_0_0_var(--accent)]"
                        : "border border-transparent font-medium text-[var(--muted)] hover:border-[var(--border)]/80 hover:bg-[var(--surface-soft)] hover:text-[var(--text)]",
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
                      <span className="min-w-0 flex-1 leading-snug">
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
