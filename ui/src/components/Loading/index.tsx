import classNames from "classnames";

function Loading({
    size = "md",
}: {
    size: "sm" | "md" | "lg";
}) {
    return (
        <div
            className="flex h-full w-full items-center justify-center gap-3 text-[var(--muted)]"
            role="status"
            aria-live="polite"
        >
            <div
                className={classNames("shrink-0 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] motion-safe:animate-spin motion-reduce:animate-none", {
                    "size-4": size === "sm",
                    "size-6": size === "md",
                    "size-8": size === "lg",
                })}
                aria-hidden
            />
        </div>
    );
}

export default Loading;
