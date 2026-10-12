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
normal layout flow. Escape and arrow/Home/End keys operate on the toolbar
buttons without taking ownership of the batch operation itself.

## LiveLog and follow-tail

The useFollowTail composable and LiveLog component keep auto-scroll in the
view layer. They watch an item collection, pause when the user scrolls away
from the bottom, and expose a follow-latest action to resume. They do not know
how items are fetched or which SSE/WebSocket transport produced them.

## Charts

`ChartCard` is the framework entry point for Chart.js-backed charts. It accepts
the `line`, `bar`, `pie`, `doughnut` and `radar` types exposed by the ui-kit,
uses the active `chart-1..5` theme tokens, and provides consistent loading,
error/retry and empty states. Pass application-owned Chart.js `data` and
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

`EmptyState` keeps its existing `actionText`/`action` event and `actions` slot;
`bordered` and the singular `action` slot are optional additions. `ErrorState`
provides retry/action events and slots with an alert role. `LoadingState`
supports block and inline layouts, `sm`/`md`/`lg` sizes, an optional message,
and `aria-busy`/`aria-live` attributes. These components render state only and
do not fetch data or own retry logic.

## TruncatedCell

`TruncatedCell` and `TruncatedText` provide the new-api DataTable long-text
pattern: a constrained `truncate` container, keyboard focus, and a Tooltip
with the full text. Pass `tooltipContent` when the displayed slot is a badge
or custom rendering; empty text does not create an empty tooltip.
## Query state synchronization

`useDataTable` accepts an optional `querySync` adapter. Its `read()` method can
restore page, pageSize, sort and filters; its `write(query)` method receives
normalized changes. The adapter belongs to the application and may wrap
vue-router, URLSearchParams or another state store. The framework does not
depend on vue-router or choose URL parameter names.

`DatePicker` and `DateTimePicker` accept optional `minDate`, `maxDate`, and
`locale` props. They are converted to the ui-kit Calendar's DateValue
constraints; omitted props preserve the previous behavior. DateTimePicker
passes the same constraints to its date half while keeping time input and
clear behavior in the wrapper.

`DataTableViewOptions` normalizes persisted visibility against the current
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

`DataTableRowActions` exposes a stable `data-action-key` for each inline and
dropdown action. A loading action is disabled, announces `aria-busy`, and
shows a spinner even when the caller did not provide an icon; callback and
permission ownership remain with the caller.

`DrawerLayout` composes the existing Drawer primitive with a fixed header,
scrollable body and optional footer. It accepts `bottom`/`right` side, title,
description, `actions`/`footer` slots and class overrides; callers still own
open state and business actions.

`Combobox` is the generic single-value searchable selector. It accepts the
same option shape as `SelectBox`, supports disabled options and an optional
`allowCustomValue` Enter path; multi-select chips remain a separate future
composition.
## ResponsiveCardList

`ResponsiveCardList` provides a reusable mobile card grid for the same rows as
a desktop DataTable. It owns responsive layout, stable row keys, loading and
empty slots; the `card` slot owns business card content.

`PageFooter` provides a reusable semantic footer with default/actions slots and
compact or sticky variants. It owns only layout and styling; page actions remain
caller-owned.
