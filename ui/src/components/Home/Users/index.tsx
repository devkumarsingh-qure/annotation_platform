import axios from "axios";
import { useEffect, useState } from "react";
import apiClient from "../../../utils/apiClient";
import { API_PATHS } from "../../../utils/urls";
import type { User } from "../../../types/User";
import AddUser from "./AddUser";
import UserList from "./UserList";
import type { PaginatedResponse } from "../../../types/PaginatedResponse";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../../utils/constants";
import { useSearchParams } from "react-router-dom";
import UserFilters from "../Filters/UserFilters";

function Users() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(
    searchParams.get("page_size") || DEFAULT_PAGE_SIZE.toString(),
  );
  const search = searchParams.get("search") || "";
  const activeRaw = searchParams.get("active") || "";
  const activeFilter: "true" | "false" | undefined =
    activeRaw === "true" || activeRaw === "false" ? activeRaw : undefined;

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<PaginatedResponse<User>>({
    total: 0,
    results: [],
  });
  /** Bump when staying on page 1 after creating a user so the list refetches. */
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);

    apiClient
      .get<PaginatedResponse<User>>(
        API_PATHS.USERS({
          page,
          page_size: pageSize,
          search: search.trim() || undefined,
          active: activeFilter,
        }),
        { signal: controller.signal },
      )
      .then((response) => {
        setUsers(response.data);
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        setUsers({ total: 0, results: [] });
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [page, pageSize, search, activeFilter, reloadNonce]);

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
    <div className="h-full min-h-0 flex flex-col p-4 sm:p-6">
      {isAddingUser ? (
        <AddUser
          onCancel={() => setIsAddingUser(false)}
          onCreated={() => {
            setIsAddingUser(false);
            if (page === 1) setReloadNonce((n) => n + 1);
            else handlePageChange(1);
          }}
        />
      ) : (
        <div className="flex min-h-0 grow flex-col">
          <UserList
            overviewTitle="Members"
            overviewDescription="Invite teammates, manage workspace access, and keep member activity easy to trace."
            overviewAction={
              <button
                type="button"
                onClick={() => setIsAddingUser(true)}
                className="min-h-10 shrink-0 cursor-pointer self-start rounded-xl border border-[color-mix(in_srgb,var(--accent-strong)_40%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_-16px_color-mix(in_srgb,var(--accent-strong)_68%,transparent)] transition hover:brightness-[1.07] active:translate-y-px active:brightness-95"
              >
                Add user
              </button>
            }
            filters={<UserFilters />}
            isLoading={isLoading}
            users={users.results}
            total={users.total}
            page={page}
            setPage={handlePageChange}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </div>
      )}
    </div>
  );
}

export default Users;
