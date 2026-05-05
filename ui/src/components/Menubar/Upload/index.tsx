import { useContext } from "react";
import { ModalContext } from "../../../contexts/modal/modalContext";
import UploadIcon from "../../../icons/UploadIcon";

function Upload() {
    const { setIsFileUploadOpen } = useContext(ModalContext);
    
    return (
        <div className="flex h-full items-center">
            <button
                type="button"
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[color-mix(in_srgb,var(--accent-strong)_40%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_color-mix(in_srgb,var(--accent-strong)_55%,transparent)] transition hover:brightness-[1.05] active:translate-y-px active:brightness-95"
                onClick={() => setIsFileUploadOpen(true)}
            >
                <UploadIcon className="size-[1.125rem] shrink-0 opacity-95" />
                <span>Upload</span>
            </button>
        </div>

    );
}

export default Upload;
