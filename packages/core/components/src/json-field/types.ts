export interface JsonFieldTemplate {
  /** Optional stable identity when the caller rebuilds or reloads the list. */
  id?: string;
  label: string;
  value: Record<string, unknown>;
  description?: string;
}
