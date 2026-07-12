export type ToastVarient = "success" | "error" | "info";

export type ToastOptions = {
    message: string;
    variant?: ToastVarient;
    duration?: number;
};

export const DEFAULT_DURATION = 3000;

