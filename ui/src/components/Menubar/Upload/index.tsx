import { useContext } from "react";
import { ModalContext } from "../../../contexts/modal/modalContext";
import UploadIcon from "../../../icons/UploadIcon";

function Upload() {
    const { setIsFileUploadOpen } = useContext(ModalContext);
    
    return (
        <div className="flex h-full items-center">
            <button
                type="button"
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[color-mix(in_srgb,var(--accent-strong)_40%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-0 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_color-mix(in_srgb,var(--accent-strong)_55%,transparent)] transition hover:brightness-[1.05] active:translate-y-px active:brightness-95 sm:w-auto sm:px-4"
                onClick={() => setIsFileUploadOpen(true)}
                title="Upload"
            >
                <UploadIcon className="size-[1.125rem] shrink-0 opacity-95" />
                <span className="hidden sm:inline">Upload</span>
            </button>
        </div>

    );
}

export default Upload;
