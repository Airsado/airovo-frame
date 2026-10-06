# @airovo/composables

The package exposes framework controllers for toast, modal and drawer flows.

`useModal` and `useDrawer` return a component/controller tuple. Both
controllers support typed payloads and typed results, close reasons, async
confirm loading, and `waitForResult()`. `OverlayStack` coordinates nested
layers, z-index allocation, top-layer ownership and opener focus restoration.
It also supports reference-counted body locking for independent consumers;
Modal/Drawer hosts opt out because their Reka primitives already share a single
DOM scroll lock with Select popups. This prevents one lock from restoring the
other lock's `hidden` value after the last host closes.

Framework Select controls inherit the nearest host's owner through
`@airovo/shared/overlay`, including when rendered in external form components.
Their body portal uses a reserved layer above that host's content and below the
next main backdrop. Opening another host or closing the owner closes its popup;
it does not raise the popup above every dialog. Reka retains responsibility for
focus scopes and Escape/outside dismissal, so the first Escape closes the Select
and later presses close the Modal/Drawer. Disabled dismissal and loading state
cannot fall through to an implicit API close.

Business forms remain in the application and return values through the
controller contract; applications need no custom host or popup z-index.
