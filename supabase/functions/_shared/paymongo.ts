const PAYMONGO_API_BASE = "https://api.paymongo.com/v1";

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function toCentavos(amount: number) {
  return Math.round(Number(amount || 0) * 100);
}

async function paymongoRequest({
  secretKey,
  path,
  method = "GET",
  payload,
}: {
  secretKey: string;
  path: string;
  method?: string;
  payload?: Record<string, unknown>;
}) {
  const response = await fetch(`${PAYMONGO_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${btoa(`${secretKey}:`)}`,
      "Content-Type": "application/json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.errors?.[0]?.detail ||
      data?.errors?.[0]?.code ||
      "PayMongo request failed.";
    throw new Error(message);
  }

  return data?.data;
}

export async function createCheckoutSession({
  secretKey,
  payload,
}: {
  secretKey: string;
  payload: Record<string, unknown>;
}) {
  return paymongoRequest({
    secretKey,
    path: "/checkout_sessions",
    method: "POST",
    payload,
  });
}

export async function createPaymentIntent({
  secretKey,
  payload,
}: {
  secretKey: string;
  payload: Record<string, unknown>;
}) {
  return paymongoRequest({
    secretKey,
    path: "/payment_intents",
    method: "POST",
    payload,
  });
}

export async function createPaymentMethod({
  secretKey,
  payload,
}: {
  secretKey: string;
  payload: Record<string, unknown>;
}) {
  return paymongoRequest({
    secretKey,
    path: "/payment_methods",
    method: "POST",
    payload,
  });
}

export async function attachPaymentIntent({
  secretKey,
  paymentIntentId,
  payload,
}: {
  secretKey: string;
  paymentIntentId: string;
  payload: Record<string, unknown>;
}) {
  return paymongoRequest({
    secretKey,
    path: `/payment_intents/${paymentIntentId}/attach`,
    method: "POST",
    payload,
  });
}

export async function retrievePaymentIntent({
  secretKey,
  paymentIntentId,
}: {
  secretKey: string;
  paymentIntentId: string;
}) {
  return paymongoRequest({
    secretKey,
    path: `/payment_intents/${paymentIntentId}`,
  });
}

export async function verifyPaymongoSignature({
  rawBody,
  signatureHeader,
  webhookSecret,
  livemode,
}: {
  rawBody: string;
  signatureHeader: string | null;
  webhookSecret: string;
  livemode: boolean;
}) {
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim(), value?.trim()];
    })
  );

  const timestamp = parts.t;
  const expectedSignature = livemode ? parts.li : parts.te;

  if (!timestamp || !expectedSignature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${rawBody}`)
  );

  return toHex(signature) === String(expectedSignature).toLowerCase();
}
