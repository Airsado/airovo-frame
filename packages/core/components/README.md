# @airovo/components

Framework-level UI compositions live here; the shadcn-vue primitives remain
unchanged in `packages/ui-kit/shadcn-vue`.

## DataTable

`DataTable` is the presentation layer. It supports stable row keys, controlled
selection, current-page select-all/indeterminate state, hidden columns,
formatters, loading, empty, error/retry and optional `DataTablePagination`.
The table viewport accepts CSS `height` and `maxHeight` values and keeps
horizontal scrolling available for narrow screens. The default
`rowKey` is `id`; every row must provide a non-empty string or finite number
through that field or through a `rowKey` function. Missing or duplicate keys
throw an error instead of silently falling back to the row index, which keeps
selection and Vue DOM identity stable when sorting or replacing data.

Use the optional `toolbar` slot for controls above the table and the `actions`
slot for a per-row action column. The toolbar exposes `selectedKeys`, `loading`,
`error`, `retry`, `sort`, `columnPinning`, `setColumnPinning`, `page` and `pageSize`; row actions expose `row`,
`index` and `rowKey`; the singular `action` slot name is accepted as an alias.
The action column and its loading/empty/error colspan are omitted when no
action slot is supplied.

`useDataTable` owns application-provided server query state. Its `fetcher`
receives `{ page, pageSize, sort, filters }` and an `AbortSignal`; it does not
know Axios, a response envelope or a business batch API. A request sequence
guard prevents a late response from replacing newer results. The default
selection policy is current-page selection; applications that need cross-page
selection must own that policy outside the component.

`DataTablePagination` composes the ui-kit Pagination primitives while keeping
the existing `page`, `pageSize`, `total`, `update:page` and `update:pageSize`
contract. It owns only page clamping and presentation; query synchronization
and data fetching remain with `useDataTable` or the caller.

For channel-style administration pages, compose `DataTablePage` with
`DataTableToolbar`, `DataTableViewOptions` and `DataTableRowActions`. The
toolbar owns presentation of debounced search, faceted filters, refresh/reset
actions and column visibility; the application still owns the filter values and
calls `useDataTable.setFilters()`. `DataTableViewOptions` accepts a caller-owned
storage key for column visibility. `DataTableRowActions` accepts typed row
actions with visible/disabled/loading predicates and an optional permission
callback. `DataTablePage` provides separate `table` and `mobile` slots so the
same query, pagination and selection state can render as a desktop table and a
mobile card list. Channel fields, API calls and edit dialogs remain application
code.

`DataTable` also accepts `columnPinning` as a record keyed by column id/key:

```ts
const columnPinning = { name: 'left', actions: 'right' } as const
```

Pinned headers and cells use sticky offsets calculated from visible columns.
The special `selection` and `actions` ids can pin the built-in checkbox and
row-action columns. `columnPinningStorageKey` restores and persists the
uncontrolled state; mobile card slots do not apply pinning.
`DataTableBulkActions` is a business-neutral selection toolbar. It renders only
when `selectedCount` is greater than zero, emits `clear-selection`, and accepts
the action buttons through the `actions` or default slot. `placement="floating"`
shows the new-api-style bottom toolbar; `placement="inline"` keeps it in the
normal layout flow. The floating toolbar uses the new-api hover scale,
transition, backdrop, border and rounded surface classes; the clear control
also exposes a tooltip. Escape and arrow/Home/End keys operate on the toolbar
buttons without taking ownership of the batch operation itself.

`DataTableRowActions` accepts `iconOnly` and `ariaLabel` for the new-api
static row-action pattern. Icon-only actions use the `icon-sm` ghost button
contract; dropdown actions preserve `permission`, `visible`, `loading` and
`variant="destructive"` state ownership with the caller.

## LiveLog and follow-tail

The useFollowTail composable and LiveLog component keep auto-scroll in the
view layer. They watch an item collection, pause when the user scrolls away
from the bottom, and expose a follow-latest action to resume. They do not know
how items are fetched or which SSE/WebSocket transport produced them.

## Charts

`ChartCard` is the framework entry point for Chart.js-backed charts. It accepts
the `line`, `bar`, `pie`, `doughnut` and `radar` types exposed by the ui-kit,
uses the active `chart-1..5` theme tokens, and provides consistent loading,
error/retry and empty states. A dataset with no data points is treated as
empty and does not mount Chart.js. Pass application-owned Chart.js `data` and
`options`; use the `actions`, `footer` and `legend` props/slots for page-level
composition. `ChartCard` does not fetch metrics or define business aggregation
rules.

## JsonField

`JsonField` keeps JSON-backed form values readable for end users. Visual mode
edits top-level key/value rows, JSON mode edits the formatted string, and both
use the same `v-model` string. `template` provides a one-click backfill,
`valueType` can be `string`, `number`, or `any`, and `parse-error` reports an
invalid raw draft without discarding it. It can be passed as a component object
in a `FormFieldSchema`; the form owns the field path and submission lifecycle,
while `JsonField` owns JSON serialization and visual editing.

## Select option hierarchy

`SelectBox` and `SearchSelect` accept recursive options:

```ts
const options: SelectOption[] = [
  {
    label: '云服务',
    children: [
      { label: 'OpenAI', value: 'openai' },
      { label: 'Claude', value: 'claude' },
    ],
  },
]
```

A node with `children` is rendered as a non-selectable group label. Only leaf
nodes with `value` can be selected, so the selected value and form backfill
remain stable. Nested labels are indented by depth; `SearchSelect` searches
the rendered descendant labels. Existing flat options keep their behavior.

## DataTable column sizing

DataTable columns can opt into resizing with `resizable`, `minSize`, and
`maxSize`. Bind `v-model:column-sizing` for a controlled map keyed by column
id/key and pass `column-sizing-storage-key` to persist widths. Resizing is
desktop table behavior; mobile card slots continue to use the same rows and
selection state.

## Status states

`StatusBadge` follows the new-api status-badge contract. Use `variant` with
`type="badge" | "text" | "underline"`, `size="sm" | "md" | "lg"`,
`label`/`icon`, `showDot`, `pulse`, `copyable`, `copyText`, or `autoColor`.
The legacy `status`/`text` props remain supported and use the same new-api
color and sizing classes. Copyable badges expose a `copy` event after the
clipboard write succeeds and can be activated with Enter or Space.

`StatusBadgeList` renders a bounded list of badge slots, a neutral `+N`
overflow badge, and an `empty` slot. It owns only layout and display limits;
the caller owns the item meaning and actions.

`EmptyState` keeps its existing `actionText`/`action` event and `actions` slot;
it follows the new-api default Database icon, “暂无数据” title and 300px
minimum height while retaining `bordered`, `size`, and the singular `action`
slot. `ErrorState`
provides retry/action events and slots with an alert role. `LoadingState`
uses the new-api 300px error / 200px loading block densities and supports block and inline layouts, `sm`/`md`/`lg` sizes, an optional message,
and `aria-busy`/`aria-live` attributes. These components render state only and
do not fetch data or own retry logic.

## TruncatedCell

`TruncatedCell` and `TruncatedText` provide the new-api DataTable long-text
pattern: a constrained `truncate` container, keyboard focus, and a Tooltip
with the full text. `TruncatedCell` extracts text from string, number, array,
and ordinary VNode slots when `text` is omitted; pass `tooltipContent` to
override the extracted value for badges or custom rendering. Empty text does
not create an empty tooltip.
## Query state synchronization

`useDataTable` accepts an optional `querySync` adapter. Its `read()` method can
restore page, pageSize, sort and filters; its `write(query)` method receives
normalized changes. Its optional `subscribe(listener)` method lets the
application feed browser history/router changes back into the table and is
cleaned up with the composable scope. The adapter belongs to the application and may wrap
vue-router, URLSearchParams or another state store. The framework does not
depend on vue-router or choose URL parameter names.

`DatePicker` uses a stable `YYYY-MM-DD` trigger label like new-api while its
calendar still receives the caller's locale. It accepts optional `minDate`, `maxDate`, and
`locale` props. They are converted to the ui-kit Calendar's DateValue
constraints while the trigger keeps the stable `YYYY-MM-DD` text. `DateTimePicker`
keeps `HH:mm:ss` precision, accepts legacy `HH:mm` input as `:00`, clones
dates before merging the selected day and time, and resets the time to
`00:00:00` when cleared. Disabled state prevents date, time, and clear edits.

`DatePickerField` is the FormFieldSchema-friendly wrapper. Set `type="date"`
or `type="datetime"`; it forwards date constraints, locale, disabled state,
v-model and form attributes such as `id`, `name`, `aria-describedby`, and
`aria-invalid`.

`DateTimePicker` follows the new-api date/time row visuals: a flexible date
trigger, a `w-32` seconds-aware time input with the browser picker indicator
hidden, and an outline clear icon button that remains shrink-0. Its value
merge, disabled, locale and FormField contracts remain caller-owned.

`DataTableViewOptions` uses a non-modal dropdown by default, exposes an
optional `modal`/`dropdownContentClass` API and emits `dropdown-open-change`.
It normalizes persisted visibility against the current
column schema, drops unknown/non-boolean entries, and keeps at least one
configurable column visible. Its trigger, menu and restore action expose
stable data-slot and aria labels for keyboard and screen-reader tests.

When used in a FormFieldSchema, pass JsonField as the component object and use
componentProps for valueType/template. The form renderer owns modelValue,
update:modelValue, disabled state, validation ARIA attributes and reset/submit
lifecycle; JsonField owns JSON parsing and draft preservation.
`JsonField` accepts `nested` for recursive visual editing. Object paths use dot
notation and array entries use bracket indexes; switching to JSON mode still
edits the same draft string, and serialization reconstructs the nested object.

`JsonCodeEditor` follows the new-api header spacing and reports clipboard
success/failure through the framework toaster without discarding the draft.

`DataTableRowActions` exposes a stable `data-action-key` for each inline and
dropdown action. A loading action is disabled, announces `aria-busy`, and
shows a spinner even when the caller did not provide an icon; callback and
permission ownership remain with the caller. The dropdown accepts
`dropdownAriaLabel`, `dropdownContentClass`, and `dropdownModal`, and emits
`dropdown-open-change` so callers can coordinate focus or overlay state.

`DrawerLayout` composes the existing Drawer primitive with a fixed header,
scrollable body and optional footer. Its right-side layout follows the
new-api side-drawer surface (`h-dvh`, no extra shadow, backdrop-blurred
header/footer, overscroll-contained body). It accepts `bottom`/`right` side, title,
description, `actions`/`footer` slots and class overrides; callers still own
open state and business actions.

`Combobox` is the generic single-value searchable selector. It accepts the
same option shape as `SelectBox`, supports disabled options and an optional
`allowCustomValue` Enter path. Options can also provide `description` and
`icon`; search matches both labels and values, `openOnFocus` controls whether
focus opens the popup, and `showSelectedIcon` controls the selected check mark.
`popupClass`, `id`, `name` and the aria props are forwarded to the public
trigger contract. Escape restores the current model value; multi-select chips
remain a separate future composition.

## Tabs

`Tabs`, `TabsList`, `TabsTrigger` and `TabsContent` wrap the Reka UI tabs
primitive. The root accepts the controlled/uncontrolled value props and emits
the normal update event; triggers support disabled state, keyboard focus and
active styling, while content panels stay associated through their `value`.
The wrapper only owns layout and theme classes; page titles, URL state and
business actions remain caller-owned.

## ResponsiveCardList

`ResponsiveCardList` provides a reusable mobile card grid for the same rows as
a desktop DataTable. It owns responsive layout, stable row keys, loading and
empty slots, and optional page/persistent row selection. In selectable mode the
`card` slot receives `selected`, `toggleRow`, and `rowKey`; the default card
renders row checkboxes and a current-page select-all control.
Page scope clears selected keys that leave the current rows; persistent scope
keeps them across row replacement, matching DataTable selection semantics.

## PageFooter

`PageFooter` provides a reusable semantic footer with default/actions slots and
compact or sticky variants. It owns only layout and styling; page actions remain
caller-owned.

`PageFooterPortal` can be placed inside `SectionPage` content to render a
`PageFooter` into the page's stable footer host, keeping it outside the content
scroll container. Direct `SectionPage` `footer` slots remain supported.

`SectionPage` keeps the existing sticky title behavior while matching the
new-api title weight (`font-bold`), responsive action spacing and content
padding. It does not add a second tabs offset or business-specific border.

## ChartCard tooltip

`ChartCard` accepts optional `tooltipLabel`/`tooltipItems` and a `tooltip` slot;
without a custom slot it renders the shared ui-kit `ChartTooltip` composition
with the new-api border, rounded surface, indicator colors and shadow. The slot
receives the normalized label/items model and is only rendered for a loaded
non-empty chart. Chart.js options and actual hover wiring remain caller-owned.
## Accordion

`Accordion`, `AccordionItem`, `AccordionHeader`, `AccordionTrigger` and
`AccordionContent` wrap the Reka UI accordion primitive. The root supports
single or multiple values, controlled or uncontrolled state, `collapsible`,
disabled items and orientation; content exposes a region labelled by its
trigger. The wrapper owns layout, border and focus styles while callers own
business content and persistence.
## Alert

`Alert`, `AlertTitle`, `AlertDescription` and `AlertAction` provide a semantic
`role="alert"` surface with `default` and `destructive` variants. The action
slot is positioned by the composition; callers own the button behavior and
whether the alert is persistent, transient or connected to request state.
## Card

`Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardAction`,
`CardDescription` and `CardContent` provide a composable surface with
`size="default" | "sm"`. Slots own the content and actions; the wrapper owns
surface, spacing, footer and theme classes.
## Table

`Table` renders an optional horizontal overflow container around the native
`table`; `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`,
`TableCell` and `TableCaption` provide styled structural slots. Pass
`withContainer=false` when an outer layout already owns scrolling; sorting,
pagination and row data remain the responsibility of DataTable or the caller.
## Pagination

`Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`,
`PaginationPrevious`, `PaginationNext` and `PaginationEllipsis` provide a
semantic navigation structure. Links expose active page and standard anchor
attributes; page calculation, routing and request state remain caller-owned.
## Empty primitives

The existing `Empty`, `EmptyHeader`, `EmptyTitle`, `EmptyDescription`,
`EmptyMedia` and `EmptyContent` primitives are exported from the ui-kit root.
Use `EmptyMedia` with `variant="icon"` for the new-api icon surface; data loading
and retry behavior belongs to framework compositions such as `EmptyState`.
## Slider

`Slider` wraps Reka UI's accessible slider root with track, range and one or
more thumbs. It forwards min/max/step, orientation, disabled and controlled or
uncontrolled values; callers own form binding and persistence.
## Spinner

`Spinner` is the shared loading indicator with `role="status"`, an accessible
label, `animate-spin` and configurable `strokeWidth`/class. Loading state
ownership and cancellation remain with the caller.
## Toggle

`Toggle` wraps Reka UI's pressed control with default/outline variants and
`default`/`sm`/`lg` sizes. It forwards controlled or uncontrolled pressed state,
disabled semantics, aria attributes and keyboard behavior.
## ButtonGroup

`ButtonGroup`, `ButtonGroupText` and `ButtonGroupSeparator` compose connected
controls with horizontal/vertical orientation, group semantics and focus
layering. Button actions, input values and form submission remain caller-owned.
## AspectRatio

`AspectRatio` provides a responsive ratio container with a `ratio` prop and
slot content. It delegates sizing semantics to Reka UI while callers own media,
overlays and loading behavior.
## Menubar

`Menubar`, `MenubarMenu`, `MenubarTrigger`, `MenubarContent`, `MenubarGroup`,
`MenubarItem`, `MenubarLabel` and `MenubarSeparator` wrap Reka UI's top-level
menu semantics. Advanced exports add portals, submenus, checkbox/radio items
and shortcuts. Keyboard navigation, focus and open state come from Reka UI;
business actions remain caller-owned.
## Resizable

`ResizablePanelGroup`, `ResizablePanel` and `ResizableHandle` provide a small
pointer/keyboard-adjustable split layout. Direction, default/min/max sizes and
separator focus are framework concerns. Pass `storageKey` to persist panel
percentages across reloads; panel content remains caller-owned.
## Carousel

`Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious` and
`CarouselNext` provide a native scroll-snap carousel with horizontal/vertical
orientation, keyboard navigation and accessible slide controls. Pass `loop` to
wrap previous/next and keyboard navigation at the ends. `autoplayInterval`
adds optional looped autoplay and pauses on hover/focus or reduced motion;
third-party plugins remain separate follow-up concerns.

## ContextMenu

`ContextMenu` exposes the reusable right-click menu composition from the ui-kit:
`ContextMenuTrigger`, `ContextMenuContent`, `ContextMenuItem`,
`ContextMenuCheckboxItem`, `ContextMenuRadioGroup`, `ContextMenuRadioItem`,
`ContextMenuSub`, `ContextMenuSubTrigger`, `ContextMenuSubContent`,
`ContextMenuLabel`, `ContextMenuSeparator`, `ContextMenuShortcut`, and
`ContextMenuItemIndicator`. The wrappers keep Reka UI's `modelValue` and
`update:modelValue` contracts for checkbox/radio state, while `inset` and
`variant="destructive"` provide the new-api menu styling. Menu content and
business actions remain owned by the caller.

## CommandMenu

`CommandMenu` composes the ui-kit command primitives into a reusable command
palette. It accepts business-neutral groups and items, supports controlled or
uncontrolled `open` state, search, empty results, shortcut labels and disabled
items, and emits the selected item and group through `select`.

```ts
const groups = [
  {
    id: 'navigation',
    label: '导航',
    items: [{ id: 'overview', label: '运营概览', shortcut: 'G O' }],
  },
] satisfies CommandMenuGroup[]
```

Use `v-model:open` when the caller owns visibility. `closeOnSelect` defaults to
`true`; set it to `false` when a selection should leave the palette open. The
`item` slot receives `{ item, group }`, the `group` slot can replace a complete
group, and the default slot can append additional ui-kit command content. The
component does not know about routing, permissions, i18n, API requests or
application stores.
