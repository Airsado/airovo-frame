import { toast } from 'vue-sonner'

/**
 * Framework toast controller.
 *
 * The controller deliberately mirrors vue-sonner's singleton API so pages can
 * use one framework import while the app owns the visual `<Toaster>` mount.
 * This keeps notifications out of page markup and lets applications replace
 * the host or configure its placement without changing business code.
 */
export type ToastApi = typeof toast

export function useToast(): ToastApi {
    return toast
}

export { toast }
