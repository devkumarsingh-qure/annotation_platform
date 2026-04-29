import axios from "axios";
import { API_PATHS } from "./urls";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const CSRF_UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

let csrfToken: string | null = null;

let inflightCsrf: Promise<void> | null = null;

async function prefetchCsrfIfNeeded(): Promise<void> {
    if (csrfToken) return;
    if (!inflightCsrf) {
        inflightCsrf = (async () => {
            const { data } = await apiClient.get<{ csrfToken: string }>(API_PATHS.CSRF());
            csrfToken = data.csrfToken;
        })().finally(() => {
            inflightCsrf = null;
        });
    }
    return inflightCsrf;
}

const apiClient = axios.create({
    baseURL,
    withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
    const method = (config.method ?? "get").toUpperCase();
    if (CSRF_UNSAFE_METHODS.has(method)) {
        await prefetchCsrfIfNeeded();
    }
    if (csrfToken && CSRF_UNSAFE_METHODS.has(method)) {
        config.headers.set("X-CSRFToken", csrfToken);
    }
    return config;
});

export default apiClient;
