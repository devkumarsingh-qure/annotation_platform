import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileIcon from "../../../icons/ProfileIcon";
import { AuthContext } from "../../../contexts/auth/authContext";
import SettingsIcon from "../../../icons/SettingsIcon";
import LogoutIcon from "../../../icons/LogoutIcon";
import MenuItem from "./MenuItem";
import Backdrop from "../../Backdrop";
import UploadIcon from "../../../icons/UploadIcon";
import { ModalContext } from "../../../contexts/modal/modalContext";
import Theme from "../Theme";
import InfoIcon from "../../../icons/InfoIcon";
import { UI_PATHS } from "../../../utils/urls";

function Profile() {
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);
    const { setIsFileUploadOpen } = useContext(ModalContext);
    const [isOpen, setIsOpen] = useState(false);

    const handleUpload = () => {
        setIsOpen(false);
        setIsFileUploadOpen(true);
    };

    const handleAbout = () => {
        setIsOpen(false);
        navigate(UI_PATHS.ABOUT());
    };

    return (
        <div className="relative flex h-full items-center">
            <button
                type="button"
                className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted)] transition hover:border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] hover:text-[var(--text)]"
                aria-expanded={isOpen}
                aria-haspopup="true"
                onClick={() => setIsOpen(!isOpen)}
            >
                <ProfileIcon className="size-[1.375rem] stroke-1" />
            </button>

            {isOpen && (
                <>
                    <Backdrop className="" onClick={() => setIsOpen(false)} />
                    <div
                        className="absolute right-0 top-full z-[60] mt-1.5 w-56 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] shadow-lg"
                        role="menu"
                    >
                        <div className="flex items-center justify-end border-b border-[var(--border)] p-2 px-3">
                            {/*<p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
                                Signed in as
                            </p>*/}
                            <p
                                className="mt-0.5 truncate text-sm font-medium text-[var(--text)]"
                                title={user?.username ?? ""}
                            >
                                {user?.username ?? "—"}
                            </p>
                        </div>

                        {user?.is_workspace_admin ? (
                            <div className="sm:hidden">
                                <MenuItem icon={<UploadIcon className="size-5" />} label="Upload" onClick={handleUpload} />
                            </div>
                        ) : null}
                        <Theme variant="menu" onToggle={() => setIsOpen(false)} />
                        <MenuItem icon={<InfoIcon className="size-5" />} label="About us" onClick={handleAbout} />
                        <MenuItem icon={<SettingsIcon className="size-5" />} label="Settings" onClick={() => { }} />
                        <MenuItem icon={<LogoutIcon className="size-5" />} label="Log out" onClick={() => logout()} />
                    </div>
                </>
            )}
        </div>
    );
}

export default Profile;
