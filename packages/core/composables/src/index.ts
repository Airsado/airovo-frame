/**
 * Framework-level controller composables.
 *
 * The tuple APIs follow the controller pattern used by vue-vben-admin:
 * `[Form, formApi]` and `[Modal, modalApi]`. Components stay owned by the
 * framework packages, while pages only coordinate state through the API.
 */
export { useForm } from '@airovo/forms'
export { ModalApi, useModal } from './modal'
export type { ModalCloseReason, ModalOptions, ModalState } from './modal'
export { toast, useToast } from './toast'
export type { ToastApi } from './toast'
