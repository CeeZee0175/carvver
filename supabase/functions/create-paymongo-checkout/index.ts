import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/http.ts";
import { createCheckoutSession, toCentavos } from "../_shared/paymongo.ts";

const COMMISSION_RATE = 0.05;

type CartService = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number | string;
  is_published: boolean | null;
  freelancer_id: string;
};

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function roundCurrency(value: number) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function normalizeService(service: CartService | CartService[] | null | undefined) {
  if (Array.isArray(service)) {
    return service[0] ?? null;
  }

  return service ?? null;
}

function resolveReturnUrl(baseUrl: string, candidate: unknown, fallback: string) {
  const nextPath =
    typeof candidate === "string" && candidate.startsWith("/") ? candidate : fallback;
  return new URL(nextPath, baseUrl).toString();
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const paymongoSecretKey = getEnv("PAYMONGO_SECRET_KEY");
    const appBaseUrl = getEnv("APP_BASE_URL");

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header." }, 401);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const body = await request.json().catch(() => ({}));
    const successUrl = resolveReturnUrl(
      appBaseUrl,
      body?.successPath,
      "/dashboard/customer/cart?checkout=success"
    );
    const cancelUrl = resolveReturnUrl(
      appBaseUrl,
      body?.cancelPath,
      "/dashboard/customer/cart?checkout=cancelled"
    );

    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select(
        `
        service_id,
        services (
          id,
          title,
          description,
          category,
          price,
          is_published,
          freelancer_id
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (cartError) {
      throw cartError;
    }

    if (!cartItems || cartItems.length === 0) {
      return jsonResponse({ error: "Your cart is empty." }, 400);
    }

    const validItems = cartItems
      .map((row) => normalizeService(row.services as CartService | CartService[] | null))
      .filter((service): service is CartService => Boolean(service?.is_published));

    if (validItems.length === 0) {
      return jsonResponse(
        { error: "Your cart only contains unavailable listings." },
        400
      );
    }

    const subtotal = roundCurrency(
      validItems.reduce((total, service) => total + Number(service.price || 0), 0)
    );

    const paymongoPayload = {
      data: {
        attributes: {
          billing: {
            email: user.email,
            name: user.user_metadata?.full_name || user.email || "Carvver customer",
          },
          description: `Carvver service checkout (${validItems.length} listing${
            validItems.length === 1 ? "" : "s"
          })`,
          line_items: validItems.map((service) => ({
            currency: "PHP",
            amount: toCentavos(Number(service.price || 0)),
            name: service.title,
            quantity: 1,
            description: service.category || service.description || "Carvver service listing",
          })),
          payment_method_types: ["gcash", "card"],
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
      },
    };

    const paymongoCheckout = await createCheckoutSession({
      secretKey: paymongoSecretKey,
      payload: paymongoPayload,
    });

    const { data: checkoutSession, error: checkoutSessionError } = await supabase
      .from("customer_checkout_sessions")
      .insert({
        user_id: user.id,
        paymongo_checkout_id: paymongoCheckout.id,
        status: "pending",
        subtotal,
        currency: "PHP",
        checkout_url: paymongoCheckout.attributes?.checkout_url || null,
        redirect_success_url: successUrl,
        redirect_cancel_url: cancelUrl,
      })
      .select("id")
      .single();

    if (checkoutSessionError || !checkoutSession) {
      throw checkoutSessionError || new Error("Couldn't create a checkout session record.");
    }

    const checkoutRows = validItems.map((service) => {
      const unitPrice = roundCurrency(Number(service.price || 0));
      const platformFee = roundCurrency(unitPrice * COMMISSION_RATE);
      const freelancerNet = roundCurrency(unitPrice - platformFee);

      return {
        checkout_session_id: checkoutSession.id,
        service_id: service.id,
        freelancer_id: service.freelancer_id,
        title: service.title,
        category: service.category || null,
        description: service.description || null,
        unit_price: unitPrice,
        platform_fee: platformFee,
        freelancer_net: freelancerNet,
      };
    });

    const { error: checkoutItemsError } = await supabase
      .from("customer_checkout_items")
      .insert(checkoutRows);

    if (checkoutItemsError) {
      throw checkoutItemsError;
    }

    return jsonResponse({
      checkoutUrl: paymongoCheckout.attributes?.checkout_url,
      sessionId: checkoutSession.id,
      subtotal,
      itemCount: validItems.length,
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Couldn't create a PayMongo checkout session.",
      },
      500
    );
  }
});
