import type { HTMLAttributes } from "vue";

export interface ColorPickerProps {
  class?: HTMLAttributes["class"];
  name?: string;
  disabled?: boolean;
  readonly?: boolean;
  clearable?: boolean;
  /** Allow an alpha channel; opaque colors remain six-digit HEX strings. */
  showAlpha?: boolean;
  /** HEX colors. Invalid and duplicate entries are omitted. Pass [] to hide. */
  presets?: readonly string[];
  placeholder?: string;
}
