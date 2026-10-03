# @airovo/components

Framework-level UI compositions live here; the shadcn-vue primitives remain
unchanged in `packages/ui-kit/shadcn-vue`.

## DataTable

`DataTable` is the presentation layer. It supports stable row keys, controlled
selection, current-page select-all/indeterminate state, hidden columns,
formatters, loading, empty, error/retry and optional pagination. The default
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

## LiveLog and follow-tail

The useFollowTail composable and LiveLog component keep auto-scroll in the
view layer. They watch an item collection, pause when the user scrolls away
from the bottom, and expose a follow-latest action to resume. They do not know
how items are fetched or which SSE/WebSocket transport produced them.
