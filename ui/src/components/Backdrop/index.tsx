function Backdrop({ onClick, className = "" }: { onClick: () => void; className?: string }) {
    return (
        <div
            className={`fixed inset-0 z-40 h-dvh w-full bg-black/35 backdrop-blur-[1px] ${className}`}
            onClick={onClick}
        ></div>
    )
}

export default Backdrop;
