import { ModalContext } from "../../../contexts/modal/modalContext";
import { useContext, useMemo, useRef, useState, type ChangeEvent } from "react";
import Backdrop from "../../Backdrop";
import XIcon from "../../../icons/XIcon";
import UploadIcon from "../../../icons/UploadIcon";
import { API_PATHS } from "../../../utils/urls";
import apiClient from "../../../utils/apiClient";
import classNames from "classnames";

function formatMb(bytes: number) {
    return (bytes / 1024 / 1024).toFixed(2);
}

const UPLOAD_BATCH_SIZE = 5;

function FileUpload({ onUploadComplete }: { onUploadComplete: () => void }) {
    const { setIsFileUploadOpen } = useContext(ModalContext);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const isUploading = useRef(false);

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadFileStatuses, setUploadFileStatuses] = useState<Record<string, { success: boolean, error?: string }>>({});

    const totalBytes = useMemo(
        () => selectedFiles.reduce((acc, f) => acc + f.size, 0),
        [selectedFiles]
    );

    const handleSelectFiles = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedFiles(Array.from(e.target.files || []));
        e.target.value = "";
    };

    const handleUpload = async () => {
        if (isUploading.current) return;

        isUploading.current = true;

        for (let i = 0; i < selectedFiles.length; i += UPLOAD_BATCH_SIZE) {
            const batch = selectedFiles.slice(i, i + UPLOAD_BATCH_SIZE);
            const batchStatuses = await uploadFiles(batch);
            setUploadFileStatuses((prev) => ({ ...prev, ...batchStatuses }));
        }
        isUploading.current = false;
        setIsFileUploadOpen(false);
        onUploadComplete();
    };

    const uploadFiles = async (files: File[]) => {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append("files", file);
        });
        const response = await apiClient.post(API_PATHS.UPLOAD(), formData);
        return response.data;
    }

    return (
        <div className="fixed top-0 left-0 z-40 h-full w-full">
            <Backdrop onClick={() => setIsFileUploadOpen(false)} />

            <div
                className="absolute top-1/2 left-1/2 z-50 flex w-[min(92vw,28rem)] max-h-[min(85vh,32rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] shadow-xl"
                role="dialog"
                aria-labelledby="file-upload-title"
                aria-modal="true"
            >
                <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3">
                    <h1 id="file-upload-title" className="text-lg font-semibold tracking-tight text-[var(--text)]">
                        File upload
                    </h1>
                    <button
                        type="button"
                        className="cursor-pointer rounded-md p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                        onClick={() => setIsFileUploadOpen(false)}
                        aria-label="Close"
                    >
                        <XIcon className="size-5" />
                    </button>
                </header>

                <div className="flex min-h-0 flex-1 flex-col">
                    {selectedFiles.length > 0 ? (
                        <>
                            <div className="shrink-0 space-y-2 px-4 pt-4">
                                <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
                                    Summary
                                </p>
                                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5">
                                    <p className="text-sm text-[var(--muted)]">
                                        <span className="font-medium tabular-nums text-[var(--text)]">
                                            {selectedFiles.length}
                                        </span>
                                        {" file"}
                                        {selectedFiles.length === 1 ? "" : "s"}
                                        {" · "}
                                        <span className="tabular-nums text-[var(--text)]">{formatMb(totalBytes)}</span>
                                        {" MB total"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
                                <div
                                    className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain rounded-lg border border-[var(--border)] bg-[var(--surface-soft)]"
                                    role="list"
                                >
                                    <ul className="divide-y divide-[var(--border)]">
                                        {selectedFiles.map((file) => (
                                            <li
                                                key={`${file.name}-${file.size}-${file.lastModified}`}
                                                role="listitem"
                                                className={classNames("flex items-center justify-between gap-3 px-3 py-2.5 first:pt-2.5 last:pb-2.5", {
                                                    "bg-[color:var(--danger)]/20": uploadFileStatuses[file.name]?.success === false,
                                                    "bg-[color:var(--success)]/20": uploadFileStatuses[file.name]?.success === true,
                                                    "bg-[color:var(--warning)]/20": uploadFileStatuses[file.name]?.success === undefined,
                                                })}
                                            >
                                                <span
                                                    className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text)]"
                                                    title={file.name}
                                                >
                                                    {file.name}
                                                </span>
                                                <span className="shrink-0 text-xs tabular-nums text-[var(--muted)]">
                                                    {formatMb(file.size)} MB
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <footer className="shrink-0 border-t border-[var(--border)] px-4 py-3">
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        className="cursor-pointer inline-flex items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                                        onClick={() => setSelectedFiles([])}
                                    >
                                        Clear selection
                                    </button>
                                    <button
                                        type="button"
                                        className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md border border-[var(--accent)]/40 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                                        onClick={handleUpload}
                                    >
                                        <UploadIcon className="size-4 shrink-0 opacity-95" />
                                        Upload
                                    </button>
                                </div>
                            </footer>
                        </>
                    ) : (
                        <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-center gap-4 px-6 py-8">
                            <div className="w-full max-w-sm rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-5 py-8 text-center">
                                <p className="text-sm leading-relaxed text-[var(--muted)]">
                                    Select DICOM file(s) to upload.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-[var(--accent)]/40 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                                onClick={handleSelectFiles}
                            >
                                <UploadIcon className="size-4 shrink-0 opacity-95" />
                                <span>Select DICOM file(s)</span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".dcm,.dicom,.DCM,application/dicom,application/dcm"
                                    onChange={handleFileChange}
                                    multiple
                                />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FileUpload;
