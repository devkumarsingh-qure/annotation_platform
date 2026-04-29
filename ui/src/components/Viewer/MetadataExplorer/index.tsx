import { useState, useMemo, useRef, useEffect } from "react";
import XIcon from "../../../icons/XIcon";
import { viewerProvider } from "@qureai/react-dicom-viewer";
import MagnifyIcon from "../../../icons/MagnifyIcon";

function MetadataExplorer({ onClose }: { onClose: () => void }) {

    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    const metadataModules = viewerProvider.metadata.explorer.MetadataModules;

    const toggleModule = (module: string) => {
        setExpandedModules(prev => {
            const newSet = new Set(prev);
            if (newSet.has(module)) {
                newSet.delete(module);
            } else {
                newSet.add(module);
            }
            return newSet;
        });
    };

    const filteredMetadata = useMemo(() => {
        type MetadataItem = {
            module: string;
            metadata: any;
            metadataModule: any;
            matchingFields: Array<{ key: string; value: any }>;
        };

        const query = searchQuery.toLowerCase().trim();
        if (!query) {
            return Object.keys(metadataModules).map((module): MetadataItem | null => {
                const metadataModule = metadataModules[module as keyof typeof metadataModules];
                const metadata = viewerProvider.metadata.explorer.getMetadataForActiveImageId(metadataModule);
                if (!metadata) return null;
                return { module, metadata, metadataModule, matchingFields: [] };
            }).filter((item): item is MetadataItem => item !== null);
        }

        const results: MetadataItem[] = [];

        Object.keys(metadataModules).forEach((module) => {
            const metadataModule = metadataModules[module as keyof typeof metadataModules];
            const metadata = viewerProvider.metadata.explorer.getMetadataForActiveImageId(metadataModule);
            if (!metadata) return;

            const matchingFields: Array<{ key: string; value: any }> = [];
            const moduleLower = module.toLowerCase();

            const moduleMatches = moduleLower.includes(query);

            Object.keys(metadata).forEach((key) => {
                const value = metadata[key as keyof typeof metadata];
                const keyLower = key.toLowerCase();
                const valueStr = typeof value === 'object' && value !== null
                    ? JSON.stringify(value).toLowerCase()
                    : String(value ?? '').toLowerCase();

                if (keyLower.includes(query) || valueStr.includes(query)) {
                    matchingFields.push({ key, value });
                }
            });

            if (moduleMatches || matchingFields.length > 0) {
                results.push({ module, metadata, metadataModule, matchingFields });
            }
        });

        return results;
    }, [searchQuery, metadataModules]);

    useMemo(() => {
        if (searchQuery.trim()) {
            const modulesToExpand = new Set<string>();
            filteredMetadata.forEach(({ module, matchingFields }: { module: string; matchingFields: Array<{ key: string; value: any }> }) => {
                if (matchingFields.length > 0 || module.toLowerCase().includes(searchQuery.toLowerCase())) {
                    modulesToExpand.add(module);
                }
            });
            setExpandedModules(modulesToExpand);
        }
    }, [searchQuery, filteredMetadata]);

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            <button
                type="button"
                className="absolute inset-0 cursor-default bg-[var(--surface)]/60 backdrop-blur-sm"
                aria-label="Close metadata explorer"
                onClick={() => { onClose(); }}
            />
            <div
                className="relative z-10 flex h-[min(85vh,44rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl shadow-black/20 ring-1 ring-black/5"
                role="dialog"
                aria-modal="true"
                aria-labelledby="metadata-explorer-title"
            >
                <header className="shrink-0 border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface-soft)]/90 to-[var(--surface)] px-3 py-2.5 sm:px-3 sm:py-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h2
                                id="metadata-explorer-title"
                                className="truncate text-sm font-semibold tracking-tight text-[var(--text)] sm:text-base"
                            >
                                Metadata Explorer
                            </h2>
                            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--muted)] sm:text-xs">
                                Active image · DICOM tags
                            </p>
                        </div>
                        <button
                            type="button"
                            className="shrink-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[var(--border)]/80 bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--border)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                            onClick={() => { onClose(); }}
                        >
                            <XIcon className="size-5" />
                        </button>
                    </div>
                </header>

                <div className="shrink-0 border-b border-[var(--border)]/80 bg-[var(--surface-soft)]/40 p-2.5 sm:p-3">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                            <MagnifyIcon className="size-4 text-[var(--muted)]" />
                        </div>
                        <input
                            ref={searchInputRef}
                            type="text"
                            inputMode="search"
                            autoComplete="off"
                            placeholder="Search by tag name or value…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-9 text-sm text-[var(--text)] shadow-inner shadow-black/5 placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 ${searchQuery ? "pr-9" : "pr-3"}`}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute inset-y-0 right-0 z-10 flex items-center justify-center px-2.5 text-[var(--muted)] transition hover:text-[var(--text)]"
                                title="Clear search"
                            >
                                <span className="sr-only">Clear search</span>
                                <XIcon className="size-5 stroke-2" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    {filteredMetadata.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-1 px-6 py-16 text-center">
                            <p className="text-sm font-medium text-[var(--text)]">
                                {searchQuery ? "No matches" : "No metadata for this image"}
                            </p>
                            <p className="max-w-sm text-xs leading-relaxed text-[var(--muted)]">
                                {searchQuery
                                    ? "Try a shorter query or a different term."
                                    : "Load a series in the viewer to inspect DICOM tags here."}
                            </p>
                        </div>
                    ) : searchQuery.trim() ? (
                        <ul className="list-none space-y-2 p-2.5 sm:p-3">
                            {filteredMetadata.flatMap(({ module, matchingFields }: { module: string; metadata: any; matchingFields: Array<{ key: string; value: any }> }) => {
                                return matchingFields.map(({ key, value }) => {
                                    const valueStr = typeof value === 'object' && value !== null
                                        ? JSON.stringify(value)
                                        : String(value ?? 'N/A');

                                    return (
                                        <li key={`${module}-${key}`}>
                                            <div className="group rounded-xl border border-[var(--border)]/80 bg-[var(--surface-strong)]/50 p-2.5 transition hover:border-[var(--accent)]/30 hover:bg-[var(--surface-strong)]/80 sm:p-3">
                                                <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--accent-strong)]/90">
                                                    {module}
                                                </p>
                                                <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,11rem)_1fr] sm:items-baseline sm:gap-x-4 sm:gap-y-1">
                                                    <div className="min-w-0 break-words text-[14px] font-medium leading-snug text-[var(--text)] sm:pt-px">
                                                        {key}
                                                    </div>
                                                    <div className="min-w-0 break-words rounded-lg bg-[var(--surface)]/90 px-2.5 py-1.5 font-mono text-xs leading-snug text-[var(--text)] ring-1 ring-inset ring-[var(--border)]/60 sm:px-3 sm:py-2">
                                                        {valueStr}
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                });
                            })}
                        </ul>
                    ) : (
                        <ul className="list-none space-y-1.5 p-2.5 sm:p-3">
                            {filteredMetadata.map(({ module, metadata }: { module: string; metadata: any; matchingFields: Array<{ key: string; value: any }> }) => {
                                const isExpanded = expandedModules.has(module);
                                const metadataKeys = Object.keys(metadata);

                                return (
                                    <li
                                        key={module}
                                        className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-strong)]/40 ring-1 ring-[var(--border)]/30 transition-shadow hover:shadow-sm"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleModule(module)}
                                            className="group flex w-full min-w-0 items-center justify-between gap-2 px-2.5 py-2 text-left transition sm:px-3 sm:py-2.5"
                                        >
                                            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--border)]/60 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-white shadow-sm">
                                                    <svg
                                                        className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="block break-words text-sm font-medium text-[var(--text)]">
                                                        {module}
                                                    </span>
                                                    <span className="mt-0.5 block text-[10px] text-[var(--muted)] sm:text-xs">
                                                        {metadataKeys.length} {metadataKeys.length === 1 ? "tag" : "tags"}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                        {isExpanded && (
                                            <div className="border-t border-[var(--border)]/70 bg-[var(--surface)]/30">
                                                <ul className="list-none space-y-1.5 p-2 sm:p-2.5">
                                                    {metadataKeys.map((key: string) => {
                                                        const value = metadata[key as keyof typeof metadata];
                                                        const valueStr = typeof value === 'object' && value !== null
                                                            ? JSON.stringify(value)
                                                            : String(value ?? 'N/A');

                                                        return (
                                                            <li
                                                                key={key}
                                                            >
                                                                <div className="grid grid-cols-1 gap-1.5 rounded-lg border border-[var(--border)]/50 bg-[var(--surface)]/50 p-2.5 sm:grid-cols-[minmax(0,11rem)_1fr] sm:items-baseline sm:gap-x-3 sm:gap-y-1 sm:p-3">
                                                                    <div className="min-w-0 break-words text-xs font-medium leading-snug text-[var(--text)] sm:pt-px">
                                                                        {key}
                                                                    </div>
                                                                    <div className="min-w-0 break-words rounded-md bg-[var(--surface-soft)]/90 px-2 py-1.5 font-mono text-xs leading-snug text-[var(--text)]">
                                                                        {valueStr}
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MetadataExplorer;