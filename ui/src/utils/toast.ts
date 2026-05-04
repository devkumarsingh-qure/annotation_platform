import { toast, type ToastOptions } from "react-toastify";

const defaults: ToastOptions = {
    position: "top-right",
    autoClose: 4500,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
};

export function toastSuccess(message: string, opts?: ToastOptions) {
    return toast.success(message, { ...defaults, ...opts });
}

export function toastError(message: string, opts?: ToastOptions) {
    return toast.error(message, { ...defaults, ...opts });
}

export function toastWarning(message: string, opts?: ToastOptions) {
    return toast.warning(message, { ...defaults, ...opts });
}
