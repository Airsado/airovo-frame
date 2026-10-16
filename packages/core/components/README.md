# @airovo/components

Framework-level UI compositions live here; the shadcn-vue primitives remain
unchanged in `packages/ui-kit/shadcn-vue`.

`ResultPage` supports success, error, warning, info and HTTP result states
with primary/secondary action events. Default title, description and secondary
action copy uses `common.result.<status>.*` locale keys; explicit props remain
authoritative.

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
Selection checkbox aria labels use `common.selectCurrentPage` and
`common.selectRow`; the selection model remains caller-owned.
Rows use the new-api muted surface contract: selected rows use `bg-muted`,
while hover blends `muted` and `background` with the same color-mix token;
pinned cells preserve the corresponding surface while scrolling.
Desktop headers use `h-10 px-2` and cells use `p-2`, matching the new-api table
density; mobile card slots keep their caller-owned spacing.
The default error and retry copy uses `common.errorLoading` and `common.retry`
locale keys; explicit `errorText` and error slots remain authoritative.

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
Its full layout follows the new-api total/rows-per-page/first-prev-pages-next-last
density; `compact` provides the mobile total/current-page/previous-next layout.

For channel-style administration pages, compose `DataTablePage` with
`DataTableToolbar`, `DataTableViewOptions` and `DataTableRowActions`. The
toolbar owns presentation of debounced search, faceted filters, refresh/reset
actions and column visibility; the application still owns the filter values and
calls `useDataTable.setFilters()`. `DataTableViewOptions` accepts a caller-owned
storage key for column visibility. `DataTableRowActions` accepts typed row
actions with visible/disabled/loading predicates and an optional permission
callback. `DataTablePage` provides separate `table` and `mobile` slots so the
same query, pagination and selection state can render as a desktop table and a
mobile card list. Set `enable-view-mode-toggle` to expose the new-api table/card
segmented control. `default-view-mode` chooses the uncontrolled initial mode,
`view-mode` makes the state controlled, and `view-mode-storage-key` persists a
per-table choice as the literal `table` or `card` value. The component emits
`update:viewMode`; card mode renders the `mobile` slot across all widths.
When `card-rows` and `card-columns` are provided, the page automatically uses
`DataTableCardGrid` for card/mobile rendering when no `mobile` slot is supplied.
Its selection events are `update:cardSelectedKeys` and
`card-selection-change`; `card-cell-{key}` slots forward into the generic cell
slots, while `card` and `card-actions` override row content and actions.
Channel fields, API calls and edit dialogs remain application code.

`DataTableViewModeToggle` is also available as a standalone controlled control.
It exposes `modelValue`, `update:modelValue`, and `change`, with `role="group"`,
`aria-pressed` buttons, new-api `bg-muted/60`/`rounded-lg` density, and tooltip
labels for the table and card choices.

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
Toolbar labels, live-region announcements, and clear-selection hints use the
framework global i18n `common.*` keys with Chinese fallbacks; explicit
`entityName` and action slots remain caller-owned.

`DataTableRowActions` accepts `iconOnly` and `ariaLabel` for the new-api
static row-action pattern. Icon-only actions use the `icon-sm` ghost button
contract; dropdown actions preserve `permission`, `visible`, `loading` and
`variant="destructive"` state ownership with the caller.

## LiveLog and follow-tail

The useFollowTail composable and LiveLog component keep auto-scroll in the
view layer. They watch an item collection, pause when the user scrolls away
from the bottom, and expose a follow-latest action to resume. They do not know
how items are fetched or which SSE/WebSocket transport produced them.
LiveLog defaults use the global `common.noLogs` and `common.followLatest`
locale keys; an explicit `emptyText` remains authoritative.

## Charts

`ChartCard` is the framework entry point for Chart.js-backed charts. It accepts
the `line`, `bar`, `pie`, `doughnut` and `radar` types exposed by the ui-kit,
uses the active `chart-1..5` theme tokens, and provides consistent loading,
error/retry and empty states. A dataset with no data points is treated as
empty and does not mount Chart.js. Pass application-owned Chart.js `data` and
`options`; use the `actions`, `footer` and `legend` props/slots for page-level
composition. `ChartCard` does not fetch metrics or define business aggregation
rules.
Pass an optional `id` to produce a stable `data-chart="chart-{id}"` root and
`data-slot="chart"` marker for theme selectors, test locators and resize
verification. The chart root keeps `min-w-0`, centered layout and `text-xs`
density while height remains caller-controlled; `aria-label` and `role="img"`
are forwarded by ChartCard.
The optional `config` maps dataset keys or labels to `{ label, color }`; when
`legend` is omitted, ChartCard derives the legend from this config and falls
back to the active `chart-1..5` tokens. Explicit `legend` remains authoritative.
Each config entry may also provide `theme: { light, dark }`; the ui-kit selects
the value from the document root theme and falls back to `color`.

## JsonField

`JsonField` keeps JSON-backed form values readable for end users. Visual mode
edits top-level key/value rows, JSON mode edits the formatted string, and both
use the same `v-model` string. `template` provides a one-click backfill,
`valueType` can be `string`, `number`, or `any`, and `parse-error` reports an
invalid raw draft without discarding it. It can be passed as a component object
in a `FormFieldSchema`; the form owns the field path and submission lifecycle,
while `JsonField` owns JSON serialization and visual editing.
Default labels, placeholders, mode actions, empty text and field action
labels use the global `common.json*`/`common.*` locale keys; explicit props
remain authoritative.
When the component receives form attributes such as `id`, `name`,
`aria-describedby`, `aria-invalid` or `data-form-root`, JsonField forwards them
to the actual JsonCodeEditor textarea in JSON mode while retaining the
`data-form-root` marker on its wrapper. This keeps labels and validation tied to
the native control instead of the visual composition container.

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

A node with `children` is rendered as a non-selectable group label. Top-level
parents create separate SelectGroup boundaries, nested labels retain their
depth, and only leaf nodes with `value` can be selected. Leaf `icon`,
`description`, and `disabled` metadata are rendered in the item while the
selected value and form backfill remain stable. `SelectBox` uses the new-api
compact `h-8 rounded-lg` trigger, anchor-width popup, ring/shadow surface,
focus token and compact label/item spacing; `allowClear`, disabled and
overlay-owner behavior remain caller-compatible. `MultiSelect` is
the chip-style multi-value composition from new-api. Its bordered control
keeps the chips and a keyboard-searchable input
in one row, uses the new-api `bg-muted`/`rounded-sm` chip surface and exposes
the same focus ring, hint marker and `+N more` density pattern. It supports
search, disabled options, optional custom creation, batch comma/newline input,
bounded visible chips, hint text and copyable chips while keeping selection
state caller-owned.
Nested labels are indented by depth; `SearchSelect` now reuses the Combobox
input surface from new-api, so the selected label and search query share one
control while descendant paths remain visible. Existing flat options keep
their behavior.
Default SelectBox/SearchSelect placeholder, search and empty-result text uses
the global `common.select*` locale keys; explicit props remain authoritative.

## DataTable column sizing

DataTable columns can opt into resizing with `resizable`, `minSize`, and
`maxSize`. Bind `v-model:column-sizing` for a controlled map keyed by column
id/key and pass `column-sizing-storage-key` to persist widths. Resizing is
desktop table behavior; mobile card slots continue to use the same rows and
selection state. Persisted sizing is migrated against the current column
schema and min/max bounds; removed columns and invalid widths are discarded
and written back. Column pinning storage follows the same current-schema
filtering for left/right sticky offsets. The resize handle is a keyboard
focusable vertical separator like new-api: ArrowLeft/ArrowRight change the
width by 10px (50px with Shift), while Enter/Space and double-click auto-size
from the rendered column content. Pointer dragging remains supported.

When `DataTable` has no rows, it renders `DataTableEmpty` with the new-api
Database icon, `common.noData` title, `common.noDataDescription` description,
and a 400px table cell surface. Use `emptyTitle`, `emptyDescription`, and
`emptyIcon` to customize the framework state, `empty-action` for an action,
or the existing `empty` slot when a caller needs to replace the whole cell.

## Status states

`StatusBadge` follows the new-api status-badge contract. Use `variant` with
`type="badge" | "text" | "underline"`, `size="sm" | "md" | "lg"`,
`label`/`icon`, `showDot`, `pulse`, `copyable`, `copyText`, or `autoColor`.
The legacy `status`/`text` props remain supported and use the same new-api
color and sizing classes. Copyable badges expose a `copy` event after the
clipboard write succeeds and can be activated with Enter or Space.
Copyable badges also expose a focus-visible ring for keyboard users; badges
with `copyable=false` remain non-focusable.

`statusPresets` exports the new-api `active`, `inactive`, `invited`,
`suspended` and `pending` display presets. `StatusPresetName` types those map
keys; the existing `StatusPreset` variant union remains compatible with
legacy callers. The presets only contain `variant`/`label` (and `pulse` for
pending); callers still decide how a domain value maps to a preset and whether
the badge is copyable.

`StatusBadgeList` renders a bounded list of badge slots, a neutral `+N`
overflow badge, and an `empty` slot. It owns only layout and display limits;
the caller owns the item meaning and actions.

`StatusBadgeTypeProvider` and `provideStatusBadgeType` mirror new-api's
`StatusBadgeTypeContext` for Vue subtrees. A provider's `type` (`badge`,
`text`, or `underline`) supplies the default for nested badges; an explicit
`type` on a badge always wins. The provider is presentational only and does
not change status colors, copy behavior, or business state mapping.

`EmptyState` keeps its existing `actionText`/`action` event and `actions` slot;
it follows the new-api default Database icon, “暂无数据” title, 300px minimum
height, `w-full`/`gap-4`/`rounded-xl`/`p-6` surface and compact title/content
density while retaining `bordered`, `size`, and the singular `action` slot.
Empty and error surfaces use motion-safe FadeIn classes and respect the user's
reduced-motion preference. Default empty/error/loading text is read from the framework global i18n
keys (`common.noData`, `common.error`, `common.retry`, `common.loading`) with
the existing Chinese strings as fallback; explicit text props always win.
`ErrorState` follows the same new-api `w-full`/`min-h-[300px]`/`gap-4`/
`rounded-xl`/`p-6` surface, compact title, icon media and action content density
as `EmptyState`. It provides retry/action events and slots with an alert role. Set `showRetry` (or
provide `retryText`) to render its outline retry button; without an explicit
retry capability no retry button is shown, matching new-api's optional
`onRetry` callback. `LoadingState`
uses the new-api 200px loading block density and supports block and inline
layouts, `sm`/`md`/`lg` sizes, an optional message, and `aria-busy`/`aria-live`
attributes. The loader is decorative so the outer state region owns the single
status role; it spins by default and stops under `prefers-reduced-motion`.
Inline loading only renders the message when the caller provides one, matching
new-api; block loading keeps the localized default message. These components render state only and
do not fetch data or own retry logic.

## TruncatedCell

`TruncatedCell` and `TruncatedText` provide the new-api DataTable long-text
pattern: a constrained `truncate` container and a Tooltip. The cell is not in
the Tab order by default, matching new-api; pass `tabIndex=0` when a caller
needs keyboard focus for the tooltip. The tooltip exposes the full text.
`TruncatedCell` extracts text from string, number, array,
and ordinary VNode slots when `text` is omitted; pass `tooltipContent` to
override the extracted value for badges or custom rendering. Empty text does
not create an empty tooltip. The new-api `cellClassName`, `contentClassName`
and `tooltipClassName` names are also accepted as aliases for the Vue `class`,
`contentClass` and `tooltipClass` props; aliases are merged rather than
replacing existing Vue props.
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
`locale` props. When omitted, the bounds default to `1900-01-01` and today,
matching new-api; explicit bounds override those defaults. They are converted to
the ui-kit Calendar's DateValue constraints while the trigger keeps the stable
`YYYY-MM-DD` text. `DateTimePicker`
keeps `HH:mm:ss` precision, accepts legacy `HH:mm` input as `:00`, clones
dates before merging the selected day and time, and resets the time to
`00:00:00` when cleared. Disabled state prevents date, time, and clear edits.

When `locale` is omitted, `DatePicker` reads the installed framework i18n
locale and falls back to `en-US`; an explicit locale always wins. Common
new-api aliases such as `zhCN`, `zhTW`, `en` and `cn` are normalised before
being passed to the Calendar, while unsupported BCP-47 values fall back to
`en-US`. This mirrors new-api's language-aware calendar selection without
making date values or business forms depend on the i18n implementation.
The outline trigger exposes `aria-haspopup="dialog"`, `aria-expanded` and a
`data-state` value (`open`/`closed`) so the Reka popover's Enter, Space, Escape
and focus-return behavior remains observable to keyboard and assistive
technology users.
Default DatePicker and DateTimePicker placeholders use
`common.datePickerPlaceholder` and `common.dateTimePickerPlaceholder`; explicit
placeholder props remain authoritative.

`DatePickerField` is the FormFieldSchema-friendly wrapper. Set `type="date"`
or `type="datetime"`; it forwards date constraints, locale, disabled state,
v-model and form attributes such as `id`, `name`, `aria-describedby`, and
`aria-invalid`.

`DateTimePicker` follows the new-api date/time row visuals: a flexible date
trigger with a Chevron icon, a `w-32` seconds-aware time input with the browser
picker indicator hidden, and an outline clear icon button that remains
shrink-0. The standalone `DatePicker` keeps its calendar icon by default;
`triggerIcon="chevron"` is the DateTimePicker composition hook. Value merge,
disabled, locale and FormField contracts remain caller-owned. When a controlled
value falls outside explicit `minDate`/`maxDate`, the date and time controls
expose `aria-invalid`, the time input is disabled, and time edits do not emit a
new out-of-range value. Empty, partial or
out-of-range time drafts never emit a normalized date: the last valid draft is
restored, the input exposes `aria-invalid` and a destructive focus/border token,
and controlled `modelValue` updates clear the invalid state.

`DataTableViewOptions` uses a non-modal dropdown by default, exposes an
optional `modal`/`dropdownContentClass` API and emits `dropdown-open-change`.
It normalizes persisted visibility against the current
column schema, drops unknown/non-boolean entries, and keeps at least one
configurable column visible. Its trigger, menu and restore action expose
stable data-slot and aria labels for keyboard and screen-reader tests.
The menu follows new-api's grouped 150px ViewOptions surface, keeps the
outline trigger compact, and exposes a keyboard-focusable reset menu item.

## FrameworkTooltip / FrameworkPopover

`FrameworkTooltip` and `FrameworkPopover` provide business-neutral overlay
compositions around the existing Reka/shadcn primitives. Both expose a
content-only `trigger` slot and optional `triggerClass`; Tooltip uses direct
as-child trigger semantics so a caller's button or link is not wrapped again.
Tooltip accepts `content` or a `content` slot plus `open`, `defaultOpen`,
`update:open`, `side`, `align`, offsets, `delayDuration`, `disabled`, and
`contentClass`. Omit `open` for the uncontrolled primitive state; bind
`v-model:open` when the caller needs to observe or control focus/hover state.
Popover exposes default
content, `open`/`defaultOpen`, `update:open`, `modal`, `side`, `align`, offsets
and `disabled`; its trigger slot also uses direct as-child semantics and must
provide the interactive root element. Their content classes match new-api's foreground/popover
surfaces, arrow, rounded corners, padding, width and ring while primitive
focus, Escape and outside behavior stays owner-controlled.

## FrameworkCalendar

`FrameworkCalendar` wraps the Reka/shadcn Calendar with a new-api aligned
surface (`bg-background`, compact padding and cell radius/size tokens). It
defaults `showOutsideDays` to `true` to match new-api while still allowing
callers to pass `false`. It forwards CalendarRoot date props, `update:modelValue` and
`update:placeholder`, plus `calendar-heading`, `calendar-prev-icon` and
`calendar-next-icon` slots. Date range, disabled and keyboard semantics remain
owned by the Calendar primitive.

`Combobox` accepts nested `SelectOption.children`. Parent entries render as
non-selectable group labels, leaf entries keep their depth/description/icon/
disabled state, and searching a leaf retains the matching parent path. Only
leaf values enter the v-model contract.

Run `pnpm dev` followed by `pnpm verify:primitives` for the repeatable
Calendar/Command/Combobox browser matrix. `PRIMITIVE_MATRIX_URL`,
`PRIMITIVE_MATRIX_USERNAME`, `PRIMITIVE_MATRIX_PASSWORD`, and
`PRIMITIVE_MATRIX_BROWSER` can override the browser executable; set
`PRIMITIVE_MATRIX_ENGINE=firefox` for Firefox. The URL and test account use
the corresponding environment variables as well.

Run `pnpm dev` followed by `pnpm verify:datatable` for the DataTable desktop,
selection, ViewOptions, dark-theme and mobile-card smoke matrix. It accepts
`DATATABLE_MATRIX_URL`, `DATATABLE_MATRIX_USERNAME`, `DATATABLE_MATRIX_PASSWORD`
and `DATATABLE_MATRIX_BROWSER` overrides; set `DATATABLE_MATRIX_ENGINE=firefox`
for Firefox.

Run `pnpm dev` followed by `pnpm verify:sectionpage` for the SectionPage/tabs/
layout scroll matrix. It accepts `SECTIONPAGE_MATRIX_URL`,
`SECTIONPAGE_MATRIX_USERNAME`, `SECTIONPAGE_MATRIX_PASSWORD`, and
`SECTIONPAGE_MATRIX_BROWSER` overrides; set `SECTIONPAGE_MATRIX_ENGINE=firefox`
for Firefox.
The wrapper intentionally uses Vue sticky header and the layout's native scroll
container instead of copying React layout code; title/tab spacing and the
scroll contract are the compatibility target.

Run `pnpm dev` followed by `pnpm verify:overlays` for the Drawer/Modal desktop,
mobile, focus, Escape and outside-click matrix. It accepts `OVERLAY_MATRIX_URL`,
`OVERLAY_MATRIX_USERNAME`, `OVERLAY_MATRIX_PASSWORD`, and
`OVERLAY_MATRIX_BROWSER` overrides; set `OVERLAY_MATRIX_ENGINE=firefox` for
Firefox.

When used in a FormFieldSchema, pass JsonField as the component object and use
componentProps for valueType/template. The form renderer owns modelValue,
update:modelValue, disabled state, validation ARIA attributes and reset/submit
lifecycle; JsonField owns JSON parsing and draft preservation.
`JsonField` accepts `nested` for recursive visual editing. Object paths use dot
notation and array entries use bracket indexes; switching to JSON mode still
edits the same draft string, and serialization reconstructs the nested object.
For `valueType="number"`, empty values retain the existing zero conversion, but
non-finite input remains in the visual draft and emits `parse-error` instead of
being serialized as `null`.

`JsonCodeEditor` follows the new-api header spacing and reports clipboard
success/failure through the framework toaster without discarding the draft. Its
`textareaRef` callback exposes the inner textarea for focus management;
`ariaInvalid` overrides the automatic JSON validity attribute when a form owns
the validation state, and `heightClassName` can replace the fixed `height`
style for theme/layout utility classes. `id`, `name`, `ariaDescribedby` and
`dataFormRoot` are forwarded to the textarea, while `parse-error` keeps the
invalid draft visible for correction. The line-number layer follows textarea
scrollTop and removes its scroll listener on unmount, matching new-api's long
text editor behavior.

`DataTableRowActions` exposes a stable `data-action-key` for each inline and
dropdown action. A loading action is disabled, announces `aria-busy`, and
shows a spinner even when the caller did not provide an icon; callback and
permission ownership remain with the caller. The dropdown accepts
`dropdownAriaLabel`, `dropdownContentClass`, and `dropdownModal`, and emits
`dropdown-open-change` so callers can coordinate focus or overlay state.
The default dropdown aria-label uses the global `common.moreActions` locale key
with a Chinese fallback; `dropdownAriaLabel` remains caller-authoritative.

`DataTableToolbar` follows the new-api toolbar composition. Existing search,
faceted filters, refresh, reset and column visibility props remain compatible;
optional `custom-search`, `additional-search`, `expandable`, `pre-actions`,
`left-actions`, `view-toggle` and `actions` slots add caller-owned controls.
The default search uses a plain Input surface with no decorative search icon;
desktop widths follow `sm:w-[200px] lg:w-[240px]`, while mobile keeps the
input flexible. Clear, debounce and IME behavior remain unchanged.
`onSearch` switches to explicit form mode and `searchLoading` renders the
loading state. `collapsibleOnMobile` wraps the filter row in
`DataTableMobileFilterPanel`, which keeps action buttons available while the
filters collapse behind an accessible expand/collapse trigger. The toolbar
does not own requests, URL state or business filter semantics.
Toolbar search, clear, reset, refresh, search-action and expand/collapse
labels use the global `common.*` locale keys; explicit `searchPlaceholder`
and caller slots remain authoritative.
`FacetedFilter` uses the same global locale defaults for its trigger, empty
results, clear action and selected-count suffix; explicit text props remain
authoritative.
When `collapsibleOnMobile` is enabled, the mobile filter panel is visible only
below the small-screen breakpoint; the ordinary toolbar remains the desktop
rendering. This keeps the same query and slot state across responsive layouts.

`DrawerLayout` composes the existing Drawer primitive with a fixed header,
scrollable body and optional footer. Its right-side layout follows the
new-api side-drawer surface (`h-dvh`, no extra shadow, backdrop-blurred
header/footer, overscroll-contained body). It accepts `bottom`/`right` side, title,
description, `actions`/`footer` slots and class overrides; callers still own
open state and business actions.

`DrawerSection`, `DrawerSectionHeader` and `DrawerSwitchItem` provide the
business-neutral section compositions from new-api's `drawer-layout.ts`.
Sections remove their final divider/padding through `last-*` utilities;
headers support title, description, icon/icon tone and an actions slot; switch
items keep descriptive content and the control slot in separate hit areas.
They only own layout and theme classes, so preference state and button
behavior remain with the caller.

`Combobox` is the generic single-value searchable selector. It accepts the
same option shape as `SelectBox`, renders a new-api-style InputGroup with a
lightweight trigger button, and keeps the search input in the control instead
of moving it into the popup. With no selected value, typing opens the popup;
with a selected value, the closed input shows the label and the trigger opens
search mode. It supports disabled options and an optional `allowCustomValue`
Enter path. Options can also provide `description` and `icon`; search matches
both labels and values, `openOnFocus` controls whether focus opens the popup,
and `showSelectedIcon` controls the selected check mark. `popupClass`, `id`,
`name` and the aria props are forwarded to the public input contract. Escape
restores the current model value; multi-select chips remain a separate
composition.

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
Default loading, empty and selection aria copy uses the global `common.*`
locale keys; explicit `emptyText` and caller slots remain authoritative.

`DataTableCardGrid` is the new-api-style generic card fallback for table/card
view modes. It accepts the same rows and `DataTableColumn` definitions, uses
`value`/`formatter`, supports `mobileTitle`, `mobileBadge`, `mobileHidden` and
`mobileOrder` metadata, and exposes `card`, `card-actions` and `cell-{key}` slots. It owns
responsive grid density, loading skeletons, empty state, selected surfaces and
page/persistent selection without knowing anything about a business API.

## PageFooter

`PageFooter` provides a reusable semantic footer with default/actions slots and
compact or sticky variants. It owns only layout and styling; page actions remain
caller-owned.

`PageFooterPortal` can be placed inside `SectionPage` content to render a
`PageFooter` into the page's stable footer host, keeping it outside the content
scroll container. Direct `SectionPage` `footer` slots remain supported.

`SectionPage` keeps the existing sticky title behavior while matching the
new-api title weight (`font-bold`), responsive action spacing and content
padding. Its optional `tabs` slot is rendered inside the same sticky header,
so tabs do not add a second top offset or move the independent content scroll
layer. Its title header has no extra bottom border, matching new-api's
borderless page title surface; content cards and footer hosts remain caller or
framework composition concerns.

## ChartCard tooltip

`ChartCard` accepts optional `tooltipLabel`/`tooltipItems` and a `tooltip` slot;
without a custom slot it renders the shared ui-kit `ChartTooltip` composition
with the new-api border, rounded surface, min-width, indicator colors, spacing,
foreground tokens and shadow. `ChartLegend` uses the same new-api centered,
wrapping legend density and square indicator treatment. The slot receives the
normalized label/items model and is only rendered for a loaded non-empty chart.
Chart.js options and actual hover wiring remain caller-owned.
The ChartCard also installs a Chart.js external tooltip adapter: hovered label,
dataset name, color and formatted value are normalized into the same tooltip
slot/model, while the existing props remain a static fallback. Loading, empty
and error states never mount the chart or tooltip.
Default loading/error/empty/retry labels use the framework i18n
`common.chartLoading`, `common.chartError`, `common.chartEmpty` and
`common.retry` keys with Chinese fallbacks; explicit `errorText` and
`emptyText` props remain authoritative.
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
dialog content follows new-api's top-third, rounded-xl, p-0 command surface;
`contentClass` is applied to the actual DialogContent element.
`item` slot receives `{ item, group }`, the `group` slot can replace a complete
group, and the default slot can append additional ui-kit command content. The
component does not know about routing, permissions, i18n, API requests or
application stores.
Default title, description, placeholder and empty-result copy uses the global
`common.commandTitle`, `common.commandDescription`, `common.commandPlaceholder`
and `common.commandEmpty` keys; explicit props remain authoritative.
