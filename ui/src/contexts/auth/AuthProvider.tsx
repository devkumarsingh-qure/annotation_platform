import { useEffect, useState } from "react";
import apiClient, { clearCsrfToken } from "../../utils/apiClient";
import { toastError, toastSuccess } from "../../utils/toast";
import { Navigate, useLocation } from "react-router-dom";
import Loading from "../../components/Loading";
import type { User } from "../../types/User";
import { USER_TYPES } from "../../utils/constants";
import { API_PATHS, UI_PATHS } from "../../utils/urls";
import { AuthContext } from "./authContext";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const location = useLocation();

    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    const refreshUser = async () => {
        try {
            const response = await apiClient.get(API_PATHS.ME());
            setUser(response.data);
        } catch (error) {
            console.error(error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial session load from /me
        void refreshUser();
    }, []);

    const login = async (username: string, password: string) => {
        try {
            setIsLoading(true);
            await apiClient.post(API_PATHS.LOGIN(), { username, password });
            clearCsrfToken();
            await refreshUser();
            toastSuccess("Signed in successfully.");
        } catch (error) {
            console.error(error);
            toastError("Could not sign in. Check your username and password.");
            setIsLoading(false);
        }
    }

    const logout = async () => {
        try {
            setIsLoading(true);
            await apiClient.post(API_PATHS.LOGOUT());
            clearCsrfToken();
            await refreshUser();
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    }

    if (isLoading) {
        return <Loading size="lg" />;
    }

    if (!user && location.pathname !== UI_PATHS.LOGIN()) {
        return <Navigate to={UI_PATHS.LOGIN()} replace />;
    }
    if (user && location.pathname === UI_PATHS.LOGIN()) {
        const home =
            user.user_type === USER_TYPES.WORKSPACE_ADMIN
                ? UI_PATHS.PATIENTS()
                : UI_PATHS.PROJECTS();
        return <Navigate to={home} replace />;
    }

    return (
        <AuthContext.Provider value={{
            user,
            refreshUser,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    )
}