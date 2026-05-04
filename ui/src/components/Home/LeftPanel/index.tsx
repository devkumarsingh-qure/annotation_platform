import { useNavigate } from "react-router-dom";
import { UI_PATHS } from "../../../utils/urls";

type TabItem = { label: string; path: string };

const TABS: TabItem[] = [
  {
    label: "Projects",
    path: UI_PATHS.PROJECTS(),
  },
  {
    label: "Patients",
    path: UI_PATHS.PATIENTS(),
  },
  {
    label: "Members",
    path: UI_PATHS.USERS(),
  },
];

function LeftPanel() {
  const navigate = useNavigate();

  return (
    <nav
      className="flex h-full flex-col bg-[color-mix(in_srgb,var(--surface)_65%,transparent)] backdrop-blur-[8px]"
      aria-label="Workspace sections"
    >
      <ul className="flex flex-1 flex-col gap-0.5 px-3 py-4">
        {TABS.map((tab) => {
          return (
            <li key={tab.path}>
              <button
                type="button"
                onClick={() => navigate(tab.path)}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 text-[var(--text)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]`}
              >
                <span className="min-w-0 flex-1">{tab.label}</span>
                <span
                  className={`text-xs opacity-0 transition group-hover:opacity-100 text-[var(--muted)]`}
                  aria-hidden
                >
                  →
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default LeftPanel;
