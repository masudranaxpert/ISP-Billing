// Runtime configuration types
interface AppConfig {
    API_URL: string;
    APP_NAME: string;
    APP_VERSION: string;
}

declare global {
    interface Window {
        APP_CONFIG: AppConfig;
    }
}

export { };
