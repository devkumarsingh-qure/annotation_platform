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
      <div className="relative z-30 flex min-h-[4.25rem] shrink-0 items-center gap-6 border-b border-[var(--border)] bg-[color:var(--surface)]/85 px-5 py-3.5 backdrop-blur-[12px]">
        <h1 className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1 text-[var(--text)]">
          <span className="truncate text-xl font-bold leading-snug tracking-tight">
            {user?.workspace.name}
          </span>
          <span className="shrink-0 text-xs font-medium leading-none text-[var(--muted)]">
            Workspace
          </span>
        </h1>

        <div className="flex h-full min-h-10 grow items-center justify-end gap-5 sm:gap-6">
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
