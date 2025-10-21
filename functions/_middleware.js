export const onRequest = async ({ request, env }) => {
  const url = new URL(request.url)
  const auth = request.headers.get("authorization")
  const expectedUser = env.BASIC_AUTH_USER
  const expectedPass = env.BASIC_AUTH_PASS

  let credentials = null

  if (auth?.startsWith("Basic ")) {
    try {
      const [, b64] = auth.split(" ", 2)
      const decoded = atob(b64)
      const separatorIndex = decoded.indexOf(":")

      if (separatorIndex !== -1) {
        credentials = {
          user: decoded.slice(0, separatorIndex),
          pass: decoded.slice(separatorIndex + 1),
        }
      }
    } catch (error) {
      credentials = null
    }
  }

  if (url.searchParams.get("logout") === "1") {
    if (
      credentials &&
      credentials.user === expectedUser &&
      credentials.pass === expectedPass
    ) {
      return Response.redirect(`${url.origin}/`, 302)
    }

    return new Response("Logged out", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Protected"' },
    })
  }

  // Require valid Basic auth credentials
  if (!credentials) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Protected"' },
    })
  }

  if (
    credentials.user !== expectedUser ||
    credentials.pass !== expectedPass
  ) {
    const logoutUrl = new URL(request.url)
    logoutUrl.searchParams.set("logout", "1")

    return new Response(
      `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Forbidden</title>
    <meta http-equiv="Cache-Control" content="no-store" />
  </head>
  <body>
    <main>
      <h1>Forbidden</h1>
      <p>Your credentials are invalid for this site.</p>
      <p><a href="${logoutUrl.pathname}${logoutUrl.search}">Log out</a> to try different credentials.</p>
    </main>
  </body>
</html>`,
      {
        status: 403,
        headers: {
          "Content-Type": "text/html; charset=UTF-8",
          "Cache-Control": "no-store",
        },
      },
    )
  }

  return env.ASSETS.fetch(request)
}
