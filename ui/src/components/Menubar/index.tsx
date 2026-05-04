import { useLocation } from "react-router-dom";
import { UI_PATHS } from "../../utils/urls";
import Profile from "./Profile";
import Theme from "./Theme";
import Upload from "./Upload";
import { useContext } from "react";
import { AuthContext } from "../../contexts/auth/authContext";
import { isWorkspaceAdmin } from "../../utils/roleUi";

function Menubar({ children }: { children: React.ReactNode }) {
    const location = useLocation();

    const { user } = useContext(AuthContext);

    if (location.pathname === UI_PATHS.LOGIN()) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="relative h-14 z-30 shrink-0 flex items-center border-b border-[var(--border)] bg-[color:var(--surface)]/85 px-4 backdrop-blur-[12px]">
                <h1 className="space-x-2 text-[var(--text)]">
                    <span className="text-xl font-bold tracking-tight">
                        {user?.workspace.name}
                    </span>
                    <span className="text-xs font-medium text-[var(--muted)]">
                        Workspace
                    </span>
                </h1>

                <div className="grow flex h-full items-center justify-end space-x-5">
                    {isWorkspaceAdmin(user?.user_type) ? <Upload /> : null}
                    <Theme />
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