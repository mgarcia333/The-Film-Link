export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['email', 'profile'],
  },
  async onSuccess(event, { user }) {
    // Identity only - no account row, no server-side history. Stats and
    // history stay entirely in the client's Pinia store.
    await setUserSession(event, {
      user: {
        name: user.name,
        avatar: user.picture ?? null,
      },
    })
    return sendRedirect(event, '/')
  },
  onError(event) {
    return sendRedirect(event, '/')
  },
})
