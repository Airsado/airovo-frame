import type { HTMLAttributes } from "vue";

export interface IconPickerProps {
  /** Explicit local names, replacing the registered local collection choices. */
  icons?: string[];
  /** Additional libraries; omitted means the default public online libraries. */
  sources?: IconPickerSource[];
  pageSize?: number;
  disabled?: boolean;
  readonly?: boolean;
  clearable?: boolean;
  type?: "input" | "icon";
  placeholder?: string;
  class?: HTMLAttributes["class"];
}

export interface IconPickerLoadContext {
  signal: AbortSignal;
}

/** Return complete Iconify names, including @provider for private services. */
export interface IconPickerSource {
  id: string;
  label: string;
  load: (context: IconPickerLoadContext) => Promise<string[]>;
}

export interface IconifySourceOptions {
  prefix: string;
  label?: string;
  provider?: string;
  /** Catalog request timeout. Successful catalogs are cached for ten minutes. */
  timeout?: number;
}
