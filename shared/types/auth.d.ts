// Google is only used for identity (name and avatar shown in the UI).
// No account is created and nothing else is stored server-side.
declare module '#auth-utils' {
  interface User {
    name: string
    avatar: string | null
  }
}

export {}
