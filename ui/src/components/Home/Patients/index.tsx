import axios from "axios";
import { useEffect, useState } from "react";
import apiClient from "../../../utils/apiClient";
import { API_PATHS } from "../../../utils/urls";
import type { PatientRow } from "../../../types/Patient";
import type { PaginatedResponse } from "../../../types/PaginatedResponse";
import PatientList from "./PatientList";
import { useSearchParams } from "react-router-dom";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../../utils/constants";
import PatientFilters from "../Filters/PatientFilters";

function Patients() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("page_size") || DEFAULT_PAGE_SIZE.toString());
  const search = searchParams.get("search") || "";
  const ageRange = searchParams.get("age_range") || "";
  const gender = searchParams.get("gender") || "";

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<PaginatedResponse<PatientRow>>({
    total: 0,
    results: [],
  });

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    apiClient
      .get<PaginatedResponse<PatientRow>>(
        API_PATHS.PATIENTS({
          page,
          page_size: pageSize,
          search,
          age_range: ageRange,
          gender,
        }),
        { signal: controller.signal },
      )
      .then((response) => {
        setData(response.data);
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        setData({ total: 0, results: [] });
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [page, pageSize, search, ageRange, gender]);

  const handlePageSizeChange = (next: number) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page_size", String(next));
      params.set("page", "1");
      return params;
    });
  };

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", page.toString());
      return params;
    });
  };

  return (
    <div className="h-full min-h-0 flex flex-col p-6">
      <header className="shrink-0 border-b border-[color-mix(in_srgb,var(--border)_75%,transparent)]">
        <div className="min-w-0 space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]">
            Patients
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[color-mix(in_srgb,var(--muted)_95%,var(--text))]">
          </p>
        </div>
      </header>

      <div className="my-3 shrink-0">
        <PatientFilters />
      </div>

      <div className="h-0 grow">
        <PatientList
          isLoading={isLoading}
          patients={data.results}
          total={data.total}
          page={page}
          setPage={handlePageChange}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />
      </div>
    </div>
  );
}

export default Patients;
