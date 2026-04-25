import { createClient } from "npm:@supabase/supabase-js@2";

const SERVICE_MEDIA_BUCKET = "service-media";
const REQUEST_MEDIA_BUCKET = "customer-request-media";
const DEFAULT_SITE_ORIGIN = "https://carvver.com";

type ShareKind = "service" | "request";

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function escapeHtml(value: unknown) {
  return normalizeText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncateText(value: unknown, maxLength = 180) {
  const text = normalizeText(value).replace(/\s+/g, " ");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function formatPeso(value: unknown, fallback = "Custom pricing") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;

  return `PHP ${numeric.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function normalizeOrigin(value: unknown) {
  try {
    const url = new URL(normalizeText(value) || DEFAULT_SITE_ORIGIN);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return DEFAULT_SITE_ORIGIN;
    }
    return url.origin;
  } catch {
    return DEFAULT_SITE_ORIGIN;
  }
}

function normalizePublicUrl(value: unknown, fallback: string) {
  try {
    const url = new URL(normalizeText(value) || fallback);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return fallback;
    }
    return url.toString();
  } catch {
    return fallback;
  }
}

function buildHtml({
  title,
  description,
  imageUrl,
  previewUrl,
  targetUrl,
}: {
  title: string;
  description: string;
  imageUrl: string;
  previewUrl: string;
  targetUrl: string;
}) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(imageUrl);
  const safePreview = escapeHtml(previewUrl);
  const safeTarget = escapeHtml(targetUrl);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <link rel="canonical" href="${safeTarget}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Carvver" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:url" content="${safePreview}" />
    <meta property="og:image" content="${safeImage}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${safeImage}" />
    <meta http-equiv="refresh" content="0;url=${safeTarget}" />
  </head>
  <body>
    <main>
      <h1>${safeTitle}</h1>
      <p>${safeDescription}</p>
      <p><a href="${safeTarget}">Open this post on Carvver</a></p>
    </main>
    <script>window.location.replace(${JSON.stringify(targetUrl)});</script>
  </body>
</html>`;
}

async function loadImageUrl(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  table: string,
  idColumn: string,
  sourceId: string
) {
  const { data } = await supabase
    .from(table)
    .select("bucket_path, media_kind, sort_order, is_cover")
    .eq(idColumn, sourceId)
    .order("is_cover", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(1);

  const media = data?.[0];
  if (!media?.bucket_path || media.media_kind === "video") return "";

  const { data: publicData } = supabase.storage
    .from(bucket)
    .getPublicUrl(media.bucket_path);

  return publicData?.publicUrl || "";
}

async function loadServicePreview(supabase: ReturnType<typeof createClient>, sourceId: string) {
  const { data, error } = await supabase
    .from("services")
    .select("id, title, category, price, location, description, listing_overview, is_published")
    .eq("id", sourceId)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const summary = truncateText(data.listing_overview || data.description);
  const facts = [formatPeso(data.price), data.category, data.location].filter(Boolean);

  return {
    title: `${normalizeText(data.title) || "Service listing"} on Carvver`,
    description: truncateText([summary, ...facts].filter(Boolean).join(" - ")),
    targetPath: `/dashboard/customer/browse-services/${data.id}`,
    imageUrl: await loadImageUrl(
      supabase,
      SERVICE_MEDIA_BUCKET,
      "service_media",
      "service_id",
      data.id
    ),
  };
}

async function loadRequestPreview(supabase: ReturnType<typeof createClient>, sourceId: string) {
  const { data, error } = await supabase
    .from("customer_requests")
    .select("id, title, category, description, budget_amount, location, timeline, status")
    .eq("id", sourceId)
    .eq("status", "open")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const facts = [
    formatPeso(data.budget_amount, "Budget not set"),
    data.category,
    data.location,
    data.timeline,
  ].filter(Boolean);

  return {
    title: `${normalizeText(data.title) || "Customer request"} on Carvver`,
    description: truncateText([data.description, ...facts].filter(Boolean).join(" - ")),
    targetPath: `/dashboard/freelancer/browse-requests/${data.id}`,
    imageUrl: await loadImageUrl(
      supabase,
      REQUEST_MEDIA_BUCKET,
      "customer_request_media",
      "request_id",
      data.id
    ),
  };
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
      },
    });
  }

  if (request.method !== "GET") {
    return new Response("Method not allowed.", { status: 405 });
  }

  try {
    const requestUrl = new URL(request.url);
    const type = normalizeText(requestUrl.searchParams.get("type")) as ShareKind;
    const sourceId = normalizeText(requestUrl.searchParams.get("id"));
    const siteOrigin = normalizeOrigin(requestUrl.searchParams.get("origin"));
    const requestedFallbackImage = requestUrl.searchParams.get("image");

    if ((type !== "service" && type !== "request") || !sourceId) {
      return new Response("Share preview not found.", { status: 404 });
    }

    const supabase = createClient(
      getEnv("SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY")
    );

    const preview =
      type === "service"
        ? await loadServicePreview(supabase, sourceId)
        : await loadRequestPreview(supabase, sourceId);

    if (!preview) {
      return new Response("Share preview not found.", { status: 404 });
    }

    const targetUrl = new URL(preview.targetPath, siteOrigin).toString();
    const fallbackImageUrl = normalizePublicUrl(
      requestedFallbackImage,
      new URL("/src/assets/carvver_icon.png", siteOrigin).toString()
    );
    const html = buildHtml({
      title: preview.title,
      description: preview.description,
      imageUrl: preview.imageUrl || fallbackImageUrl,
      previewUrl: requestUrl.toString(),
      targetUrl,
    });

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("Share preview could not be loaded.", { status: 500 });
  }
});
