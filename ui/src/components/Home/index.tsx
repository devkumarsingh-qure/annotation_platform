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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-2 pt-2 sm:px-4 sm:pb-4 sm:pt-4 md:flex-row md:gap-4 lg:gap-6 lg:px-6 lg:pb-6 lg:pt-6">
        <aside className="hidden shrink-0 flex-col md:flex md:h-full md:min-h-0 md:w-56 lg:w-64">
          <LeftPanel />
        </aside>

        <main
          id="workspace-main"
          className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--border)_92%,transparent)] bg-[color-mix(in_srgb,var(--surface-strong)_62%,transparent)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--surface-strong)_55%,transparent),0_1px_0_color-mix(in_srgb,var(--border)_65%,transparent),0_28px_80px_-40px_color-mix(in_srgb,var(--accent)_22%,transparent),0_12px_32px_-24px_color-mix(in_srgb,var(--text)_12%,transparent)] backdrop-blur-[14px] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-soft)_22%,transparent)_0%,transparent_42%,transparent_100%)] before:opacity-[0.85] sm:rounded-xl md:rounded-2xl"
        >
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <Outlet />
          </div>
        </main>
      </div>
      {isFileUploadOpen && me.is_workspace_admin ? (
        <FileUpload onBatchUploadComplete={() => {}} />
      ) : null}
    </div>
  );
}

export default Home;
