export const onRequest = async ({ request, env }) => {
  const auth = request.headers.get("authorization");
  const expectedUser = env.BASIC_AUTH_USER;
  const expectedPass = env.BASIC_AUTH_PASS;

  // Require Basic auth header
  if (!auth?.startsWith("Basic ")) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Protected"' },
    });
  }

  // Decode and verify
  const [, b64] = auth.split(" ");
  const [user, pass] = atob(b64).split(":");
  if (user !== expectedUser || pass !== expectedPass) {
    return new Response("Forbidden", { status: 403 });
  }

  return await fetch(request);
};
