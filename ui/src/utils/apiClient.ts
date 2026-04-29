import axios from "axios";
import { API_PATHS } from "./urls";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const CSRF_UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Deduplicate concurrent fetches; do not keep a long-lived token.
 * After a round completes, the next mutating call hits GET /csrf/ again so the value always
 * matches the current session (login/logout/cookie rotation) without the app "forgetting" to clear.
 */
let inflightCsrf: Promise<string> | null = null;

async function getCsrfToken(): Promise<string> {
    if (!inflightCsrf) {
        inflightCsrf = apiClient
            .get<{ csrfToken: string }>(API_PATHS.CSRF())
            .then((r) => r.data.csrfToken)
            .finally(() => {
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
        const token = await getCsrfToken();
        config.headers.set("X-CSRFToken", token);
    }
    return config;
});

export default apiClient;
