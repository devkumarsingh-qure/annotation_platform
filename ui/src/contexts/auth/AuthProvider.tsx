import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import { Navigate, useLocation } from "react-router-dom";
import Loading from "../../components/Loading";
import type { User } from "../../types/User";
import { API_PATHS, UI_PATHS } from "../../utils/urls";
import { AuthContext } from "./authContext";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const location = useLocation();

    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        void refreshUser();
    }, []);

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
    }

    const login = async (username: string, password: string) => {
        try {
            setIsLoading(true);
            await apiClient.post(API_PATHS.LOGIN(), { username, password });
            await refreshUser();
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    }

    const logout = async () => {
        try {
            setIsLoading(true);
            await apiClient.post(API_PATHS.LOGOUT());
            await refreshUser();
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    }

    if (isLoading) {
        return <Loading />;
    }

    if (!user && location.pathname !== UI_PATHS.LOGIN()) {
        return <Navigate to={UI_PATHS.LOGIN()} replace />;
    }
    if (user && location.pathname === UI_PATHS.LOGIN()) {
        return <Navigate to={UI_PATHS.PATIENTS()} replace />;
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