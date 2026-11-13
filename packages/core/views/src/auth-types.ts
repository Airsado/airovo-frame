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
    /** Optional one-time token returned by the email verification flow. */
    verificationToken?: string
    /** Optional account recovery question configured at registration time. */
    securityQuestion?: string
    securityAnswer?: string
}
