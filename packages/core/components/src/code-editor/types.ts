export type CodeEditorLanguage = "javascript" | "typescript" | "json" | "text";

export interface CodeEditorProps {
  modelValue?: string;
  language?: CodeEditorLanguage;
  readOnly?: boolean;
  disabled?: boolean;
  height?: string | number;
  placeholder?: string;
  lineWrapping?: boolean;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  ariaInvalid?: boolean | "true" | "false";
  ariaRequired?: boolean | "true" | "false";
  id?: string;
  name?: string;
  dataFormRoot?: string;
}

export interface CodeEditorApi {
  focus: () => void;
}

export interface CodeEditorConfiguration {
  language: CodeEditorLanguage;
  readOnly: boolean;
  disabled: boolean;
  placeholder: string;
  lineWrapping: boolean;
  dark: boolean;
  attributes: Record<string, string>;
}

export interface CodeEditorInstance extends CodeEditorApi {
  setValue: (value: string) => void;
  configure: (configuration: CodeEditorConfiguration) => void;
  destroy: () => void;
}
