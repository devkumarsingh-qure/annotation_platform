import { useLocation } from "react-router-dom";
import { UI_PATHS } from "../../utils/urls";
import Profile from "./Profile";
import Theme from "./Theme";
import Upload from "./Upload";
import { useContext } from "react";
import { AuthContext } from "../../contexts/auth/authContext";

function Menubar({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const { user } = useContext(AuthContext);

  if (location.pathname === UI_PATHS.LOGIN()) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative z-30 flex min-h-[3.75rem] shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[color:var(--surface)]/85 px-3 py-2.5 backdrop-blur-[12px] sm:min-h-[4.25rem] sm:gap-6 sm:px-5 sm:py-3.5">
        <h1 className="flex min-w-0 flex-1 flex-col gap-0.5 text-[var(--text)] sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2.5 sm:gap-y-1">
          <span className="truncate text-base font-bold leading-snug tracking-tight sm:text-xl">
            {user?.workspace.name}
          </span>
          <span className="hidden shrink-0 text-xs font-medium leading-none text-[var(--muted)] sm:inline">
            Workspace
          </span>
        </h1>

        <div className="flex min-h-10 shrink-0 items-center justify-end gap-2 sm:gap-6">
          {user?.is_workspace_admin ? <Upload /> : null}
          <Theme />
          <Profile />
        </div>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

export default Menubar;
