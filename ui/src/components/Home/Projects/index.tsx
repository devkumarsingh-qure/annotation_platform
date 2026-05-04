import { Outlet } from "react-router-dom";

function Projects() {
    return (
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-[color-mix(in_srgb,var(--bg)_40%,transparent)]">
            <Outlet />
        </div>
    );
}

export default Projects;
