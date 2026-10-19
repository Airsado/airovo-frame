/**
 * Visual contracts copied from new-api's shared data-table controls.
 *
 * These classes intentionally live in the core composition layer.  They keep
 * the data-table components stable when the underlying ui-kit receives an
 * upstream update; the ui-kit primitives remain unchanged.
 * Reduced-motion animation overrides repeat the state selector so they win
 * against state-specific enter/exit utilities without a global !important.
 */

export const NEW_API_BUTTON_BASE =
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all motion-reduce:transition-none outline-none select-none active:not-aria-[haspopup]:translate-y-px focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

export const NEW_API_BUTTON_VARIANTS = {
  default: "bg-primary text-primary-foreground hover:bg-primary [&:is(a)]:hover:bg-primary/80",
  outline:
    "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
  ghost:
    "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
  destructive:
    "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
  link: "text-primary underline-offset-4 hover:underline",
} as const;

export const NEW_API_BUTTON_SIZES = {
  default:
    "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
  xs: "h-6 gap-1 rounded-md px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
  sm: "h-7 rounded-md gap-1 px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
  lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
  icon: "size-8",
  "icon-xs":
    "size-6 rounded-md in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
  "icon-sm": "size-7 rounded-md in-data-[slot=button-group]:rounded-lg",
  "icon-lg": "size-9",
} as const;

export type NewApiButtonVariant = keyof typeof NEW_API_BUTTON_VARIANTS;
export type NewApiButtonSize = keyof typeof NEW_API_BUTTON_SIZES;

export function newApiButtonClass(
  variant: NewApiButtonVariant = "default",
  size: NewApiButtonSize = "default",
  extra?: string,
): string {
  return [
    // Stable markers identify the composition's public visual variants.
    "new-api-button",
    `new-api-button-variant-${variant}`,
    `new-api-button-size-${size}`,
    NEW_API_BUTTON_BASE,
    NEW_API_BUTTON_VARIANTS[variant],
    NEW_API_BUTTON_SIZES[size],
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export const NEW_API_INPUT_CLASS =
  "border-input file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors motion-reduce:transition-none shadow-none outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-3 focus-visible:ring-inset disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 aria-invalid:ring-inset md:text-sm";

export const NEW_API_DROPDOWN_CONTENT_CLASS =
  "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--reka-dropdown-menu-content-available-height) min-w-[8rem] origin-(--reka-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg border-0 p-1 shadow-md ring-1 ring-foreground/10 duration-100 motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none outline-none data-[state=closed]:overflow-hidden";

export const NEW_API_DROPDOWN_ITEM_CLASS =
  "group/dropdown-menu-item focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:[&_svg]:text-destructive relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*='text-'])]:text-current";

export const NEW_API_DROPDOWN_CHECKBOX_ITEM_CLASS =
  "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>span]:right-1.5 [&>span]:left-auto";

export const NEW_API_DROPDOWN_LABEL_CLASS =
  "text-muted-foreground px-1.5 py-1 text-xs font-medium";

export const NEW_API_POPOVER_CONTENT_CLASS =
  "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 flex w-72 flex-col gap-2.5 rounded-lg border-0 p-2.5 text-sm shadow-md ring-1 ring-foreground/10 origin-(--reka-popover-content-transform-origin) motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none outline-hidden";

export const NEW_API_COMMAND_CLASS =
  "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-xl p-1";

export const NEW_API_COMMAND_INPUT_CLASS =
  "placeholder:text-muted-foreground min-w-0 w-full bg-transparent text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50";

export const NEW_API_COMMAND_LIST_CLASS =
  "max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none";

export const NEW_API_COMMAND_ITEM_CLASS =
  "data-[highlighted]:bg-muted data-[highlighted]:text-foreground data-[highlighted]:[&_svg:not([class*='text-'])]:text-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

export const NEW_API_SELECT_CONTENT_CLASS =
  "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--reka-select-content-available-height) min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-lg border-0 shadow-md ring-1 ring-foreground/10 origin-(--reka-select-content-transform-origin) duration-100 motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none";

export const NEW_API_SELECT_ITEM_CLASS =
  "focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg:not([class*='text-'])]:text-current";

export const NEW_API_SELECT_TRIGGER_CLASS =
  "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-3 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-1.5 rounded-lg border bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors motion-reduce:transition-none outline-none select-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-md";
