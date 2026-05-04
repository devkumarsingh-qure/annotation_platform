import { Outlet } from "react-router-dom";
import LeftPanel from "./LeftPanel";
import { useContext } from "react";
import { ModalContext } from "../../contexts/modal/modalContext";
import { AuthContext } from "../../contexts/auth/authContext";
import FileUpload from "../Modals/FileUpload";
import { isWorkspaceAdmin } from "../../utils/roleUi";

function Home() {
    const { isFileUploadOpen } = useContext(ModalContext);
    const { user: me } = useContext(AuthContext);

    return (
        <div className="flex h-full min-h-0 w-full flex-col">
            <div className="flex min-h-0 flex-1 overflow-hidden">
                <div className="w-[10%] shrink-0 border-r border-[var(--border)]">
                    <LeftPanel />
                </div>

                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                    <Outlet />
                </div>
            </div>
            {isFileUploadOpen && isWorkspaceAdmin(me?.user_type) ? (
                <FileUpload
                    onBatchUploadComplete={() => { }}
                />
            ) : null}
        </div>
    )
}

export default Home;