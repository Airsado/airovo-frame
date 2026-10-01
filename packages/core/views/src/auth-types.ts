/** Generic form values emitted by the framework's authentication views. */
export interface LoginValues {
    username: string
    password: string
}

export interface RegisterValues {
    username: string
    email: string
    password: string
    confirmPassword: string
}
