
function Loading({
    size
}: {
    size: number;
}) {
    return (
        <div
            className="flex h-full w-full items-center justify-center gap-3 text-[var(--muted)]"
            role="status"
            aria-live="polite"
        >
            <div
                className={`size-${size} shrink-0 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] motion-safe:animate-spin motion-reduce:animate-none`}
                aria-hidden
            />
        </div>
    );
}

export default Loading;
