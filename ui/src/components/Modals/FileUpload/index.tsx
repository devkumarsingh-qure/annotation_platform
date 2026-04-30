import { ModalContext } from "../../../contexts/modal/modalContext";
import { useContext, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Backdrop from "../../Backdrop";
import XIcon from "../../../icons/XIcon";
import UploadIcon from "../../../icons/UploadIcon";
import { API_PATHS } from "../../../utils/urls";
import apiClient from "../../../utils/apiClient";
import classNames from "classnames";
import type { Patient } from "../../../types/Patient";
import Loading from "../../Loading";

function formatMb(bytes: number) {
    return (bytes / 1024 / 1024).toFixed(2);
}

function fileRowKey(file: File) {
    return `${file.name}-${file.size}-${file.lastModified}`;
}

const UPLOAD_BATCH_SIZE = 1;

function FileUpload({
    onBatchUploadComplete,
}: {
    onBatchUploadComplete: (batchStatuses: Record<string, { success: boolean, patient: Patient }>) => void;
}) {
    const { setIsFileUploadOpen } = useContext(ModalContext);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileRowRefs = useRef<Record<string, HTMLElement | null>>({});

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadFileStatuses, setUploadFileStatuses] = useState<Record<string, { success: boolean, error?: string }>>({});

    const totalBytes = useMemo(
        () => selectedFiles.reduce((acc, f) => acc + f.size, 0),
        [selectedFiles]
    );

    const { successCount, failedCount } = useMemo(() => {
        let ok = 0;
        let bad = 0;
        for (const f of selectedFiles) {
            const st = uploadFileStatuses[f.name];
            if (st?.success === true) ok += 1;
            else if (st?.success === false) bad += 1;
        }
        return { successCount: ok, failedCount: bad };
    }, [selectedFiles, uploadFileStatuses]);

    const latestCompletedFileKey = useMemo(() => {
        for (let i = selectedFiles.length - 1; i >= 0; i -= 1) {
            const f = selectedFiles[i];
            const st = uploadFileStatuses[f.name];
            if (st?.success === true || st?.success === false) {
                return fileRowKey(f);
            }
        }
        return null;
    }, [selectedFiles, uploadFileStatuses]);

    useEffect(() => {
        if (!latestCompletedFileKey) return;
        const frame = requestAnimationFrame(() => {
            fileRowRefs.current[latestCompletedFileKey]?.scrollIntoView({
                block: "nearest",
                behavior: "smooth",
            });
        });
        return () => cancelAnimationFrame(frame);
    }, [latestCompletedFileKey]);

    const handleSelectFiles = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedFiles(Array.from(e.target.files || []));
        setUploadFileStatuses({});
        e.target.value = "";
    };

    const handleUpload = async () => {
        if (isUploading) return;

        setIsUploading(true);

        for (let i = 0; i < selectedFiles.length; i += UPLOAD_BATCH_SIZE) {
            const batch = selectedFiles.slice(i, i + UPLOAD_BATCH_SIZE);
            const batchStatuses = await uploadFiles(batch);
            setUploadFileStatuses((prev) => ({ ...prev, ...batchStatuses }));
            onBatchUploadComplete(batchStatuses);
        }
        setIsUploading(false);
        close();
    };

    const uploadFiles = async (files: File[]) => {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append("files", file);
        });
        const response = await apiClient.post(API_PATHS.UPLOAD(), formData);
        return response.data;
    }

    const clearSelection = () => {
        if (isUploading) return;
        setSelectedFiles([]);
        setUploadFileStatuses({});
    }

    const close = () => {
        if (isUploading) return;
        setIsFileUploadOpen(false);
    }

    return (
        <div className="fixed top-0 left-0 z-40 h-full w-full">
            <Backdrop onClick={close} />

            <div
                className="absolute top-1/2 left-1/2 z-50 flex w-1/2 max-h-[min(85vh,32rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] shadow-xl"
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
                        onClick={close}
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
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
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
                                        {
                                            isUploading && (
                                                <div className="flex shrink-0 items-center justify-end gap-4 text-right">
                                                    <div>
                                                        <Loading size="sm" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-[var(--muted)]">
                                                            <span className="font-medium tabular-nums text-[color:var(--success)]">
                                                                {successCount}
                                                            </span>
                                                            {" succeeded"}
                                                            <span className="mx-1.5 text-[var(--border)]">·</span>
                                                            <span className="font-medium tabular-nums text-[color:var(--danger)]">
                                                                {failedCount}
                                                            </span>
                                                            {" failed"}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        }
                                    </div>
                                    {isUploading && (
                                        <div className="mt-3 space-y-1.5">
                                            <div
                                                className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]/80 ring-1 ring-inset ring-[var(--border)]/40"
                                                role="progressbar"
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                                aria-valuenow={Math.round(
                                                    selectedFiles.length
                                                        ? Math.min(
                                                              100,
                                                              ((successCount + failedCount) / selectedFiles.length) * 100
                                                          )
                                                        : 0
                                                )}
                                                aria-label="Upload progress"
                                            >
                                                <div
                                                    className="h-full min-w-0 max-w-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] shadow-[0_0_12px_-2px_var(--accent)] transition-[width] duration-300 ease-out"
                                                    style={{
                                                        width: `${selectedFiles.length ? Math.min(100, ((successCount + failedCount) / selectedFiles.length) * 100) : 0}%`,
                                                    }}
                                                />
                                            </div>
                                            <p className="text-center text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
                                                <span className="tabular-nums text-[var(--text)]">
                                                    {successCount + failedCount}
                                                </span>
                                                <span className="text-[var(--border)]"> / </span>
                                                <span className="tabular-nums text-[var(--text)]">{selectedFiles.length}</span>
                                                {" files processed"}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
                                <div
                                    className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain rounded-lg border border-[var(--border)] bg-[var(--surface-soft)]"
                                    role="list"
                                >
                                    <ul className="divide-y divide-[var(--border)]">
                                        {selectedFiles.map((file) => {
                                            const rowKey = fileRowKey(file);
                                            return (
                                                <li
                                                    key={rowKey}
                                                    ref={(el) => {
                                                        fileRowRefs.current[rowKey] = el;
                                                    }}
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
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>

                            <footer className="shrink-0 border-t border-[var(--border)] px-4 py-3">
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        className={classNames("cursor-pointer inline-flex items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]", {
                                            "opacity-50 pointer-events-none": isUploading,
                                        })}
                                        onClick={clearSelection}
                                    >
                                        Clear selection
                                    </button>
                                    <button
                                        type="button"
                                        className={classNames("cursor-pointer inline-flex items-center justify-center gap-2 rounded-md border border-[var(--accent)]/40 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent", {
                                            "opacity-50 pointer-events-none": isUploading,
                                        })}
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
