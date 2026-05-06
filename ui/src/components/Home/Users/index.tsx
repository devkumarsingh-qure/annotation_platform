import { useCallback, useEffect, useState } from "react";
import apiClient from "../../../utils/apiClient";
import { API_PATHS } from "../../../utils/urls";
import type { User } from "../../../types/User";
import AddUser from "./AddUser";
import UserList from "./UserList";
import type { PaginatedResponse } from "../../../types/PaginatedResponse";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../../utils/constants";

function Users() {
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [users, setUsers] = useState<PaginatedResponse<User>>({
    total: 0,
    results: [],
  });

  const loadUsers = useCallback(() => {
    setIsLoading(true);
    apiClient
      .get<PaginatedResponse<User>>(
        API_PATHS.USERS({ page, page_size: pageSize }),
      )
      .then((response) => {
        setUsers(response.data);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [page, pageSize]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const totalPages = Math.max(1, Math.ceil(users.total / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handlePageSizeChange = (next: number) => {
    setPageSize(next);
    setPage(1);
  };

  return (
    <div className="h-full min-h-0">
      {isAddingUser ? (
        <AddUser
          onCancel={() => setIsAddingUser(false)}
          onCreated={() => {
            setIsAddingUser(false);
            if (page === 1) loadUsers();
            else setPage(1);
          }}
        />
      ) : (
        <UserList
          onAddUser={() => setIsAddingUser(true)}
          isLoading={isLoading}
          users={users.results}
          total={users.total}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />
      )}
    </div>
  );
}

export default Users;
