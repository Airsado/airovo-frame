export interface AppShellAuthHandlers {
    reauthenticate: (values: { username: string; password: string }) => Promise<void>
    logout?: () => void | Promise<void>
}
