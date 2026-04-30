import { useContext } from "react";
import { ModalContext } from "../../../contexts/modal/modalContext";
import UploadIcon from "../../../icons/UploadIcon";

function Upload() {
    const { setIsFileUploadOpen } = useContext(ModalContext);
    
    return (
        <div className="flex items-center justify-center h-full">
            <button
                type="button"
                className="inline-flex h-1/2 w-full cursor-pointer items-center gap-2 rounded-md border border-[var(--accent)]/40 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-3.5 text-xs font-medium text-white shadow-sm"
                onClick={() => setIsFileUploadOpen(true)}
            >
                <UploadIcon className="size-4 shrink-0 opacity-95" />
                <span>Upload</span>
            </button>
        </div>

    );
}

export default Upload;
