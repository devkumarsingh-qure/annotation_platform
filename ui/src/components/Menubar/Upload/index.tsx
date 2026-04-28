import { useContext } from "react";
import { ModalContext } from "../../../contexts/ModalProvider";
import UploadIcon from "../../../icons/UploadIcon";

function Upload() {
    const { setIsFileUploadOpen } = useContext(ModalContext);
    
    return (
        <div className="flex items-center justify-center h-full py-1.5">
            <button
                type="button"
                className="inline-flex h-full w-full cursor-pointer items-center gap-2 rounded-md border border-[var(--accent)]/40 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-3.5 text-sm font-medium text-white shadow-sm transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                onClick={() => setIsFileUploadOpen(true)}
            >
                <UploadIcon className="size-4 shrink-0 opacity-95" />
                <span>Upload</span>
            </button>
        </div>

    );
}

export default Upload;
