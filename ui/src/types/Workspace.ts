export type Workspace = {
    id: string;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
};

export type ProjectUserPatientsAssignment = {
    user: {
        id: string;
        username: string;
    };
    patients: {
        id: string;
        PatientID: string;
    }[];
};

/** GET /projects/:id/ — metadata only; rosters live on dedicated endpoints. */
export type ProjectType = {
    id: string;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
    member_count: number;
    patient_count: number;
};

export type ProjectDetailType = ProjectType;

/** GET /projects/:id/users/ */
export type ProjectMemberRow = {
    id: string;
    username: string;
    role: string;
};

/** GET /projects/:id/users/:userId/ */
export type ProjectUserDetailResponse = {
    user: {
        id: string;
        username: string;
        email: string;
        user_type: string;
        is_active: boolean;
        date_joined: string;
        last_login: string | null;
    };
    role: string | null;
    assigned_patients: {
        id: string;
        PatientID: string;
    }[];
};
