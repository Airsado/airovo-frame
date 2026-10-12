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
`error`, `retry`, `sort`, `page` and `pageSize`; row actions expose `row`,
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
