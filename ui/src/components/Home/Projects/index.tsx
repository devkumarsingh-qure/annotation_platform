import { useCallback, useContext, useEffect, useState } from "react";
import apiClient from "../../../utils/apiClient";
import { API_PATHS } from "../../../utils/urls";
import type { Project } from "../../../types/Project";
import PageOverviewHeader from "../PageOverviewHeader";
import AddProject from "./AddProject";
import ProjectList from "./ProjectList";
import type { PaginatedResponse } from "../../../types/PaginatedResponse";
import { AuthContext } from "../../../contexts/auth/authContext";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../../utils/constants";

function Projects() {
  const { user } = useContext(AuthContext);

  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [projects, setProjects] = useState<PaginatedResponse<Project>>({
    total: 0,
    results: [],
  });

  const loadProjects = useCallback(
    (targetPage: number) => {
      setIsProjectsLoading(true);
      apiClient
        .get<PaginatedResponse<Project>>(
          API_PATHS.PROJECTS({
            page: targetPage,
            page_size: pageSize,
          }),
        )
        .then((response) => {
          setProjects(response.data);
        })
        .finally(() => {
          setIsProjectsLoading(false);
        });
    },
    [pageSize],
  );

  useEffect(() => {
    loadProjects(page);
  }, [page, pageSize, loadProjects]);

  const handlePageSizeChange = (next: number) => {
    setPageSize(next);
    setPage(1);
  };

  return (
    <div className="h-full">
      {isAddingProject ? (
        <AddProject
          onCancel={() => setIsAddingProject(false)}
          onCreated={() => {
            setIsAddingProject(false);
            if (page === 1) loadProjects(1);
            else setPage(1);
          }}
        />
      ) : (
        <div className="flex h-full min-h-0 flex-col p-3 sm:p-6">
          <PageOverviewHeader
            title="Projects"
            description="Organize annotation workstreams, invite collaborators, and keep patient coverage easy to audit at a glance."
            action={
              user?.is_workspace_admin ? (
                <button
                  type="button"
                  onClick={() => setIsAddingProject(true)}
                  className="min-h-9 shrink-0 cursor-pointer self-start rounded-lg border border-[color-mix(in_srgb,var(--accent-strong)_40%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-3 py-2 text-xs font-semibold text-white shadow-[0_14px_28px_-16px_color-mix(in_srgb,var(--accent-strong)_68%,transparent)] transition hover:brightness-[1.07] active:translate-y-px active:brightness-95 sm:min-h-10 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  Add project
                </button>
              ) : undefined
            }
          />
          <div className="min-h-0 flex-1">
            <ProjectList
              isProjectsLoading={isProjectsLoading}
              projects={projects}
              page={page}
              setPage={setPage}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
