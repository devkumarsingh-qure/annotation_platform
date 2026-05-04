import { useCallback, useEffect, useState } from "react";
import apiClient from "../../../utils/apiClient";
import { API_PATHS } from "../../../utils/urls";
import type { Project } from "../../../types/Project";
import AddProject from "./AddProject";
import ProjectList from "./ProjectList";
import type { PaginatedResponse } from "../../../types/PaginatedResponse";

const DEFAULT_PROJECTS_PAGE_SIZE = 5;
const PROJECTS_PAGE_SIZE_OPTIONS = [5, 10, 20];

function Projects() {
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PROJECTS_PAGE_SIZE);
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
        <ProjectList
          onAddProject={() => setIsAddingProject(true)}
          isProjectsLoading={isProjectsLoading}
          projects={projects}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={PROJECTS_PAGE_SIZE_OPTIONS}
        />
      )}
    </div>
  );
}

export default Projects;
