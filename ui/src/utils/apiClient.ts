import axios, { type InternalAxiosRequestConfig } from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
    baseURL,
    withCredentials: true,
});

const bareClient = axios.create({
    baseURL,
    withCredentials: true,
});

let csrfReady: Promise<void> | null = null;

async function prefetchCsrf(): Promise<void> {
    const { data } = await bareClient.get<{ csrfToken: string }>("/csrf/");
    const token = data.csrfToken;
    apiClient.defaults.headers.common["X-CSRFToken"] = token;
}

async function ensureCsrf(): Promise<void> {
    if (!csrfReady) {
        csrfReady = prefetchCsrf().catch((err) => {
            csrfReady = null;
            throw err;
        });
    }
    await csrfReady;
}

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const method = (config.method ?? "get").toLowerCase();
    if (["post", "put", "patch", "delete"].includes(method)) {
        await ensureCsrf();
    }
    return config;
});

export default apiClient;

export { ensureCsrf };
