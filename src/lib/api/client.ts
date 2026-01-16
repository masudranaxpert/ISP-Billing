import axios from 'axios';

// Get API URL from runtime config (injected by Docker entrypoint)
// No fallback - must be configured via environment variables
const API_URL = window.APP_CONFIG?.API_URL || import.meta.env.VITE_API_URL;

if (!API_URL) {
    throw new Error('API_URL is not configured. Please set VITE_API_URL environment variable.');
}

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = 'Bearer ' + token;
                    return apiClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');

            if (refreshToken) {
                return new Promise(function (resolve, reject) {
                    axios.post(`${API_URL}/auth/token/refresh/`, {
                        refresh: refreshToken,
                    })
                        .then(({ data }) => {
                            const { access, refresh } = data;
                            localStorage.setItem('accessToken', access);
                            if (refresh) {
                                localStorage.setItem('refreshToken', refresh);
                            }

                            apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + access;
                            originalRequest.headers['Authorization'] = 'Bearer ' + access;

                            processQueue(null, access);
                            resolve(apiClient(originalRequest));
                        })
                        .catch((err) => {
                            processQueue(err, null);
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('refreshToken');
                            // Only redirect if we are not already at login to avoid loops
                            if (window.location.pathname !== '/login') {
                                window.location.href = '/login';
                            }
                            reject(err);
                        })
                        .finally(() => {
                            isRefreshing = false;
                        })
                });
            } else {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
