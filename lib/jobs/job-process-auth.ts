type JobProcessAuthResult =
  | {
      allowed: true;
      secretConfigured: boolean;
    }
  | {
      allowed: false;
      status: 401 | 500;
      error: string;
    };

function getBearerToken(authorizationHeader: string | null) {
  if (!authorizationHeader) {
    return null;
  }

  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);

  return match ? match[1].trim() : null;
}

export function authorizeJobProcessRequest(request: Request): JobProcessAuthResult {
  const configuredSecret = process.env.JOB_PROCESS_SECRET?.trim() ?? "";

  if (!configuredSecret) {
    if (process.env.NODE_ENV === "production") {
      return {
        allowed: false,
        status: 500,
        error: "JOB_PROCESS_SECRET is required in production."
      };
    }

    console.warn("JOB_PROCESS_SECRET is not set; allowing local job processing in development.");
    return {
      allowed: true,
      secretConfigured: false
    };
  }

  const authorizationHeader = request.headers.get("authorization");
  const bearerToken = getBearerToken(authorizationHeader);
  const xJobSecret = request.headers.get("x-job-secret")?.trim() ?? "";

  if (bearerToken === configuredSecret || xJobSecret === configuredSecret) {
    return {
      allowed: true,
      secretConfigured: true
    };
  }

  return {
    allowed: false,
    status: 401,
    error: "Unauthorized."
  };
}
