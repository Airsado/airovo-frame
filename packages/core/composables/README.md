# @airovo/composables

The package exposes framework controllers for toast, modal and drawer flows.

`useModal` and `useDrawer` return a component/controller tuple. Both
controllers support typed payloads and typed results, close reasons, async
confirm loading, and `waitForResult()`. `OverlayStack` coordinates nested
layers, z-index allocation, top-layer Escape/outside handling, body scroll-lock
reference counting and opener focus restoration. Business forms remain in the
application and return values through the controller contract.
