import { Outlet } from "react-router-dom";
import LeftPanel from "./LeftPanel";
import { useContext } from "react";
import { ModalContext } from "../../contexts/modal/modalContext";
import { AuthContext } from "../../contexts/auth/authContext";
import FileUpload from "../Modals/FileUpload";

function Home() {
  const { isFileUploadOpen } = useContext(ModalContext);
  const { user: me } = useContext(AuthContext);
  if (!me) {
    throw new Error("User not found");
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="w-[15%] shrink-0 p-6">
          <LeftPanel />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
      {isFileUploadOpen && me.is_workspace_admin ? (
        <FileUpload onBatchUploadComplete={() => {}} />
      ) : null}
    </div>
  );
}

export default Home;
