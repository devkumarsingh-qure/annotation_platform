function Backdrop({ onClick, className = "" }: { onClick: () => void; className?: string }) {
    return (
        <div
            className={`fixed top-0 left-0 z-40 h-screen w-screen bg-black/35 backdrop-blur-[1px] ${className}`}
            onClick={onClick}
        ></div>
    )
}

export default Backdrop;