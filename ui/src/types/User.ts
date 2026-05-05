export type User = {
  id: string;
  username: string;
  email: string;
  workspace: {
    id: string;
    name: string;
  };
  is_workspace_admin: boolean;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  assigned_patient_count?: number;
};
