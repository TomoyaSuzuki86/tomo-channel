export function authorizeAdminRequest(request: Request) {
  const configuredSecret = process.env.ADMIN_API_SECRET?.trim();

  if (!configuredSecret) {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false as const,
        response: Response.json(
          {
            ok: false,
            error: "ADMIN_API_SECRET is required in production."
          },
          { status: 500 }
        )
      };
    }

    console.warn(
      JSON.stringify({
        scope: "api.admin",
        message: "ADMIN_API_SECRET is not set. Allowing local request without auth."
      })
    );

    return { ok: true as const };
  }

  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const providedSecret = match?.[1]?.trim() ?? "";

  if (!providedSecret || providedSecret !== configuredSecret) {
    return {
      ok: false as const,
      response: Response.json(
        {
          ok: false,
          error: "Unauthorized."
        },
        { status: 401 }
      )
    };
  }

  return { ok: true as const };
}
