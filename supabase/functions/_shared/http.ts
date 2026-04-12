export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function extractBearerToken(authHeader: string | null) {
  if (!authHeader) return null;

  const [scheme, token] = String(authHeader).split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token?.trim()) {
    return null;
  }

  return token.trim();
}

export function serializeError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return {
      message: error.message || fallback,
      details: error.stack || null,
      kind: "error",
    };
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const message =
      (typeof record.message === "string" && record.message) ||
      (typeof record.error === "string" && record.error) ||
      (typeof record.details === "string" && record.details) ||
      fallback;

    return {
      message,
      details: record,
      kind: "object",
    };
  }

  return {
    message: typeof error === "string" && error ? error : fallback,
    details: error ?? null,
    kind: typeof error,
  };
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}
