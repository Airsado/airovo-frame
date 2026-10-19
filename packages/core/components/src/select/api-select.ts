import type { SelectOption } from "./options";

/** The application owns endpoint, response mapping, and permission handling. */
export interface ApiSelectContext {
  search: string;
  signal: AbortSignal;
  /** One-based page; loaders returning arrays remain unpaginated. */
  page?: number;
}

export interface ApiSelectPage {
  options: SelectOption[];
  hasMore: boolean;
  hint?: string;
}

export type ApiSelectResolver = (
  value: string,
  context: { signal: AbortSignal },
) => Promise<SelectOption | undefined>;

export type ApiSelectLoader = (
  context: ApiSelectContext,
) => Promise<SelectOption[] | ApiSelectPage>;
