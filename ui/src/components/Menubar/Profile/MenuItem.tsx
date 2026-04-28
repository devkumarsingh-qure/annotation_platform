function MenuItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
    return (
        <div className="p-1">
            <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
                role="menuitem"
                onClick={onClick}
            >
                <span>
                    {icon}
                </span>
                <span>
                    {label}
                </span>
            </button>
        </div>
    )
}

export default MenuItem;