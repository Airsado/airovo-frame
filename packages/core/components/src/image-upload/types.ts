export interface ImageUploadContext {
  signal: AbortSignal;
  onProgress: (percent: number) => void;
}

/** Transport stays in the application; the component never owns an endpoint. */
export type ImageUploadHandler = (
  file: File,
  context: ImageUploadContext,
) => Promise<string | { url: string }>;

export interface ImageUploadProps {
  modelValue?: string;
  upload: ImageUploadHandler;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  readonly?: boolean;
  id?: string;
  label?: string;
  hint?: string;
}
