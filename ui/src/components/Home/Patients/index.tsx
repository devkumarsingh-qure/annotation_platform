import { useCallback, useEffect, useState } from "react";
import apiClient from "../../../utils/apiClient";
import { API_PATHS } from "../../../utils/urls";
import type { PatientRow } from "../../../types/Patient";
import type { PaginatedResponse } from "../../../types/PaginatedResponse";
import PatientList from "./PatientList";

const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

function Patients() {
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [data, setData] = useState<PaginatedResponse<PatientRow>>({
    total: 0,
    results: [],
  });

  const loadPatients = useCallback(() => {
    setIsLoading(true);
    apiClient
      .get<PaginatedResponse<PatientRow>>(
        API_PATHS.PATIENTS({ page, page_size: pageSize }),
      )
      .then((response) => {
        setData(response.data);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [page, pageSize]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handlePageSizeChange = (next: number) => {
    setPageSize(next);
    setPage(1);
  };

  return (
    <div className="h-full min-h-0">
      <PatientList
        isLoading={isLoading}
        patients={data.results}
        total={data.total}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
      />
    </div>
  );
}

export default Patients;
