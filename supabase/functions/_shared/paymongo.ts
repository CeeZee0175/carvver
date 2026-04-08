const PAYMONGO_API_BASE = "https://api.paymongo.com/v1";

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function toCentavos(amount: number) {
  return Math.round(Number(amount || 0) * 100);
}

export async function createCheckoutSession({
  secretKey,
  payload,
}: {
  secretKey: string;
  payload: Record<string, unknown>;
}) {
  const response = await fetch(`${PAYMONGO_API_BASE}/checkout_sessions`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${secretKey}:`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.errors?.[0]?.detail ||
      data?.errors?.[0]?.code ||
      "PayMongo checkout session creation failed.";
    throw new Error(message);
  }

  return data?.data;
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
