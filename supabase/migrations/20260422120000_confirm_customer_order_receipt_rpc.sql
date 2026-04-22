CREATE OR REPLACE FUNCTION "public"."confirm_customer_order_receipt"("p_order_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_order public.orders%rowtype;
  v_payout_method public.freelancer_payout_methods%rowtype;
  v_payout_destination_ready boolean := false;
  v_next_payout_status text;
  v_next_escrow_status text;
  v_update_title text;
  v_update_body text;
  v_message text;
  v_now timestamptz := timezone('utc', now());
  v_payout_request_id uuid;
  v_update_id uuid;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'You need to be signed in to continue.';
  END IF;

  SELECT *
    INTO v_order
    FROM public.orders
   WHERE id = p_order_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'We could not find that order.';
  END IF;

  IF v_order.customer_id IS DISTINCT FROM v_actor_id THEN
    RAISE EXCEPTION 'You can only confirm your own orders.';
  END IF;

  IF coalesce(v_order.escrow_status, 'held') = 'released' THEN
    RETURN jsonb_build_object(
      'escrowStatus', 'released',
      'payoutRequestStatus', 'released',
      'message', 'This order was already completed and the payout has already been released.',
      'payoutRequestId', NULL,
      'updateId', NULL
    );
  END IF;

  SELECT *
    INTO v_payout_method
    FROM public.freelancer_payout_methods
   WHERE freelancer_id = v_order.freelancer_id;

  v_payout_destination_ready :=
    coalesce(btrim(v_payout_method.payout_method), '') <> ''
    AND coalesce(btrim(v_payout_method.account_name), '') <> ''
    AND coalesce(btrim(v_payout_method.account_reference), '') <> '';

  v_next_payout_status := CASE WHEN v_payout_destination_ready THEN 'pending' ELSE 'blocked' END;
  v_next_escrow_status := CASE WHEN v_payout_destination_ready THEN 'pending_release' ELSE 'blocked' END;
  v_update_title := CASE
    WHEN v_payout_destination_ready THEN 'Order completed and payout queued'
    ELSE 'Order completed but payout blocked'
  END;
  v_update_body := CASE
    WHEN v_payout_destination_ready THEN 'The customer marked this order as completed. The freelancer payout is now queued for ops release.'
    ELSE 'The customer marked this order as completed. The payout is blocked until the freelancer payout details are fixed.'
  END;
  v_message := CASE
    WHEN v_payout_destination_ready THEN 'Order completed. The freelancer payout is now queued for ops release.'
    ELSE 'Order completed. The payout is blocked until the freelancer updates their payout details.'
  END;

  INSERT INTO public.payout_release_requests (
    order_id,
    customer_id,
    freelancer_id,
    amount,
    currency,
    status,
    destination_method,
    destination_account_name,
    destination_account_reference,
    provider_reference,
    ops_note,
    requested_at,
    processed_at,
    released_at,
    updated_at
  )
  VALUES (
    p_order_id,
    v_order.customer_id,
    v_order.freelancer_id,
    coalesce(v_order.freelancer_net, 0),
    'PHP',
    v_next_payout_status,
    nullif(btrim(v_payout_method.payout_method), ''),
    nullif(btrim(v_payout_method.account_name), ''),
    nullif(btrim(v_payout_method.account_reference), ''),
    NULL,
    CASE
      WHEN v_payout_destination_ready THEN 'Queued for ops release after customer confirmation.'
      ELSE 'Blocked because the freelancer payout destination is missing or incomplete.'
    END,
    v_now,
    CASE WHEN v_payout_destination_ready THEN NULL ELSE v_now END,
    NULL,
    v_now
  )
  ON CONFLICT (order_id) DO UPDATE
    SET customer_id = EXCLUDED.customer_id,
        freelancer_id = EXCLUDED.freelancer_id,
        amount = EXCLUDED.amount,
        currency = EXCLUDED.currency,
        status = EXCLUDED.status,
        destination_method = EXCLUDED.destination_method,
        destination_account_name = EXCLUDED.destination_account_name,
        destination_account_reference = EXCLUDED.destination_account_reference,
        provider_reference = NULL,
        ops_note = EXCLUDED.ops_note,
        requested_at = EXCLUDED.requested_at,
        processed_at = EXCLUDED.processed_at,
        released_at = NULL,
        processed_by_admin_id = NULL,
        updated_at = v_now
  RETURNING id INTO v_payout_request_id;

  UPDATE public.orders
     SET status = 'completed',
         escrow_status = v_next_escrow_status,
         completed_at = coalesce(completed_at, v_now),
         released_at = NULL
   WHERE id = p_order_id;

  INSERT INTO public.order_updates (
    order_id,
    author_id,
    author_role,
    update_kind,
    title,
    body
  )
  VALUES (
    p_order_id,
    v_actor_id,
    'customer',
    'status',
    v_update_title,
    v_update_body
  )
  RETURNING id INTO v_update_id;

  RETURN jsonb_build_object(
    'escrowStatus', v_next_escrow_status,
    'payoutRequestStatus', v_next_payout_status,
    'message', v_message,
    'payoutRequestId', v_payout_request_id,
    'updateId', v_update_id
  );
END;
$$;

ALTER FUNCTION "public"."confirm_customer_order_receipt"("p_order_id" "uuid") OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."confirm_customer_order_receipt"("p_order_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."confirm_customer_order_receipt"("p_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."confirm_customer_order_receipt"("p_order_id" "uuid") TO "service_role";
