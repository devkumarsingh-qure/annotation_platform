import axios from "axios";
import { API_PATHS } from "./urls";

const baseURL = import.meta.env.VITE_API_BASE_URL;

/** Set from GET /csrf/; axios cannot read API-origin csrftoken cookies in cross-site setups. */
let csrfToken: string | null = null;

const apiClient = axios.create({
    baseURL,
    withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
    if (csrfToken) {
        config.headers.set("X-CSRFToken", csrfToken);
    }
    return config;
});

/**
 * Fetches a CSRF token and primes the session cookie. Call on load and before login if needed.
 * Safe to call multiple times.
 */
export async function ensureCsrfToken(): Promise<void> {
    const { data } = await apiClient.get<{ csrfToken: string }>(API_PATHS.CSRF());
    csrfToken = data.csrfToken;
}

export default apiClient;

