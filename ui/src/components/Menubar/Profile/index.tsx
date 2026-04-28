import { useContext, useState } from "react";
import ProfileIcon from "../../../icons/ProfileIcon";
import { AuthContext } from "../../../contexts/auth/authContext";
import SettingsIcon from "../../../icons/SettingsIcon";
import LogoutIcon from "../../../icons/LogoutIcon";
import MenuItem from "./MenuItem";
import Backdrop from "../../Backdrop";

function Profile() {
    const { user, logout } = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative flex h-full items-center">
            <button
                type="button"
                className="flex cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] p-1 text-[var(--muted)] transition hover:text-[var(--text)]"
                aria-expanded={isOpen}
                aria-haspopup="true"
                onClick={() => setIsOpen(!isOpen)}
            >
                <ProfileIcon className="size-10 stroke-1" />
            </button>

            {isOpen && (
                <>
                    <Backdrop className="" onClick={() => setIsOpen(false)} />
                    <div
                        className="absolute right-0 top-full z-[60] mt-1.5 w-56 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] shadow-lg"
                        role="menu"
                    >
                        <div className="flex items-center justify-between border-b border-[var(--border)] p-2 px-3">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
                                Signed in as
                            </p>
                            <p
                                className="mt-0.5 truncate text-sm font-medium text-[var(--text)]"
                                title={user.username}
                            >
                                {user.username}
                            </p>
                        </div>

                        <MenuItem icon={<SettingsIcon className="size-5" />} label="Settings" onClick={() => { }} />
                        <MenuItem icon={<LogoutIcon className="size-5" />} label="Log out" onClick={() => logout()} />
                    </div>
                </>
            )}
        </div>
    );
}

export default Profile;
