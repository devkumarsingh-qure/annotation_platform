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
      <div className="flex min-h-0 flex-1 gap-6 overflow-hidden px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
        <aside className="flex h-full min-h-0 w-52 shrink-0 flex-col sm:w-64">
          <LeftPanel />
        </aside>

        <main
          id="workspace-main"
          className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--border)_92%,transparent)] bg-[color-mix(in_srgb,var(--surface-strong)_62%,transparent)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--surface-strong)_55%,transparent),0_1px_0_color-mix(in_srgb,var(--border)_65%,transparent),0_28px_80px_-40px_color-mix(in_srgb,var(--accent)_22%,transparent),0_12px_32px_-24px_color-mix(in_srgb,var(--text)_12%,transparent)] backdrop-blur-[14px] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-soft)_22%,transparent)_0%,transparent_42%,transparent_100%)] before:opacity-[0.85]"
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
