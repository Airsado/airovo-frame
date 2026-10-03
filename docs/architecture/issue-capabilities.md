# Issue capability boundaries

This document records the implementation boundary for Issues #1–#4. It is
kept deliberately separate from visual layout documentation.

| Capability | Framework owns | Application owns |
|---|---|---|
| Request protocol | Axios instance, token injection, `RequestError`, envelope parsing helpers | Success codes, response unwrapping, endpoint API, toast text, 401 refresh policy |
| Modal/Drawer | Typed controllers, overlay stack, focus and body scroll coordination | Business form content and result handling |
| DataTable | Presentation, selection, pagination state and request composable | Fetcher, filters, response mapping and batch API |
| SSE | Transport/session primitives and lifecycle state | Endpoint, authentication choice, event business meaning and demo data |

The framework does not hard-code a business API, a particular envelope code,
or an Authorization strategy that the browser transport cannot support.
