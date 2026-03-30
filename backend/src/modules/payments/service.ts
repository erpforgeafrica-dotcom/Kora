import { dbPool, queryDb } from "../../db/client.js";
import { getStripeClient, isStripeConfigured } from "./stripeClient.js";

export type PaymentMethod =
  | "card_present"
  | "card"
  | "bank_transfer"
  | "cash"
  | "loyalty_points"
  | "split";

export interface CreatePaymentIntentInput {
  organizationId: string;
  amountCents: number;
  currency: string;
  invoiceId?: string;
  bookingId?: string;
  clientId?: string;
}

export async function createPaymentIntent(input: CreatePaymentIntentInput) {
  const normalizedCurrency = input.currency.toLowerCase();

  if (process.env.ENABLE_MOCK_PAYMENTS === "true") {
    const paymentIntentId = `pi_mock_${Date.now()}`;
    const clientSecret = `${paymentIntentId}_secret_mock`;

    await queryDb(
      `insert into transactions (
         id, organization_id, invoice_id, booking_id, client_id, stripe_payment_intent_id,
         stripe_customer_id, amount_cents, currency, status, payment_method, metadata
       ) values (
         gen_random_uuid(), $1, $2, $3, $4, $5, null, $6, $7, 'pending', 'card', $8::jsonb
       )
       on conflict (stripe_payment_intent_id)
       do update set
         invoice_id = excluded.invoice_id,
         booking_id = excluded.booking_id,
         client_id = excluded.client_id,
         amount_cents = excluded.amount_cents,
         currency = excluded.currency,
         metadata = excluded.metadata`,
      [
        input.organizationId,
        input.invoiceId ?? null,
        input.bookingId ?? null,
        input.clientId ?? null,
        paymentIntentId,
        input.amountCents,
        normalizedCurrency,
        JSON.stringify({ provider: "mock_stripe", client_secret_present: true })
      ]
    );

    return {
      clientSecret,
      paymentIntentId,
      provider: "mock_stripe"
    };
  }

  if (!isStripeConfigured()) {
    throw new Error("stripe_not_configured");
  }

  const stripe = getStripeClient();

  let stripeCustomerId: string | null = null;
  if (input.clientId) {
    const clientRows = await queryDb<{ stripe_customer_id: string | null; email: string | null; full_name: string }>(
      `select stripe_customer_id, email, full_name
         from clients
        where id = $1 and organization_id = $2
        limit 1`,
      [input.clientId, input.organizationId]
    );
    const client = clientRows[0];
    if (client?.stripe_customer_id) {
      stripeCustomerId = client.stripe_customer_id;
    } else if (client) {
      const customer = await stripe.customers.create({
        email: client.email ?? undefined,
        name: client.full_name,
        metadata: {
          client_id: input.clientId,
          organization_id: input.organizationId
        }
      });
      stripeCustomerId = customer.id;

      await queryDb(`update clients set stripe_customer_id = $3, updated_at = now() where id = $1 and organization_id = $2`, [
        input.clientId,
        input.organizationId,
        stripeCustomerId
      ]);

      await queryDb(
        `insert into stripe_customers (id, organization_id, client_id, stripe_customer_id, email, metadata)
         values (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb)
         on conflict (stripe_customer_id) do update
           set email = excluded.email,
               metadata = excluded.metadata`,
        [
          input.organizationId,
          input.clientId,
          stripeCustomerId,
          client.email,
          JSON.stringify({ source: "payments.intent" })
        ]
      );
    }
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: input.amountCents,
    currency: normalizedCurrency,
    customer: stripeCustomerId ?? undefined,
    automatic_payment_methods: { enabled: true },
    metadata: {
      organization_id: input.organizationId,
      invoice_id: input.invoiceId ?? "",
      booking_id: input.bookingId ?? "",
      client_id: input.clientId ?? ""
    }
  });

  await queryDb(
    `insert into transactions (
       id, organization_id, invoice_id, booking_id, client_id, stripe_payment_intent_id,
       stripe_customer_id, amount_cents, currency, status, payment_method, metadata
     ) values (
       gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 'pending', 'card', $9::jsonb
     )
     on conflict (stripe_payment_intent_id)
     do update set
       invoice_id = excluded.invoice_id,
       booking_id = excluded.booking_id,
       client_id = excluded.client_id,
       stripe_customer_id = excluded.stripe_customer_id,
       amount_cents = excluded.amount_cents,
       currency = excluded.currency,
       metadata = excluded.metadata`,
    [
      input.organizationId,
      input.invoiceId ?? null,
      input.bookingId ?? null,
      input.clientId ?? null,
      paymentIntent.id,
      stripeCustomerId,
      input.amountCents,
      normalizedCurrency,
      JSON.stringify({ provider: "stripe", client_secret_present: Boolean(paymentIntent.client_secret) })
    ]
  );

  return {
    clientSecret: paymentIntent.client_secret ?? "",
    paymentIntentId: paymentIntent.id,
    provider: "stripe"
  };
}

export async function attachPaymentMethod(params: {
  organizationId: string;
  clientId: string;
  paymentMethodId: string;
  setDefault?: boolean;
}) {
  if (!isStripeConfigured()) {
    throw new Error("stripe_not_configured");
  }

  const stripe = getStripeClient();
  const clientRows = await queryDb<{ stripe_customer_id: string | null }>(
    `select stripe_customer_id from clients where id = $1 and organization_id = $2 limit 1`,
    [params.clientId, params.organizationId]
  );
  const stripeCustomerId = clientRows[0]?.stripe_customer_id;
  if (!stripeCustomerId) {
    throw new Error("client_missing_stripe_customer");
  }

  const paymentMethod = await stripe.paymentMethods.attach(params.paymentMethodId, { customer: stripeCustomerId });
  if (params.setDefault) {
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: params.paymentMethodId }
    });
  }

  if (params.setDefault) {
    await queryDb(`update payment_methods set is_default = false where client_id = $1`, [params.clientId]);
  }

  await queryDb(
    `insert into payment_methods (
       id, client_id, stripe_payment_method_id, type, brand, last4, exp_month, exp_year, is_default
     ) values (
       gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8
     )
     on conflict (stripe_payment_method_id)
     do update set
       brand = excluded.brand,
       last4 = excluded.last4,
       exp_month = excluded.exp_month,
       exp_year = excluded.exp_year,
       is_default = excluded.is_default`,
    [
      params.clientId,
      paymentMethod.id,
      paymentMethod.type,
      paymentMethod.card?.brand ?? null,
      paymentMethod.card?.last4 ?? null,
      paymentMethod.card?.exp_month ?? null,
      paymentMethod.card?.exp_year ?? null,
      Boolean(params.setDefault)
    ]
  );

  return {
    id: paymentMethod.id,
    brand: paymentMethod.card?.brand ?? null,
    last4: paymentMethod.card?.last4 ?? null,
    is_default: Boolean(params.setDefault)
  };
}

export async function listPaymentMethods(clientId: string, organizationId: string) {
  return queryDb<{
    id: string;
    stripe_payment_method_id: string;
    type: string;
    brand: string | null;
    last4: string | null;
    exp_month: number | null;
    exp_year: number | null;
    is_default: boolean;
  }>(
    `select pm.id::text,
            pm.stripe_payment_method_id,
            pm.type,
            pm.brand,
            pm.last4,
            pm.exp_month,
            pm.exp_year,
            pm.is_default
       from payment_methods pm
       join clients c on c.id = pm.client_id
      where pm.client_id = $1
        and c.organization_id = $2
      order by pm.is_default desc, pm.created_at desc`,
    [clientId, organizationId]
  );
}

export async function initializePosPayment(params: {
  organizationId: string;
  amountCents: number;
  currency: string;
  gateway: "stripe" | "flutterwave" | "paystack" | "paypal";
  bookingId?: string | null;
  clientId?: string | null;
}) {
  if (params.gateway === "stripe") {
    const intent = await createPaymentIntent({
      organizationId: params.organizationId,
      amountCents: params.amountCents,
      currency: params.currency,
      bookingId: params.bookingId ?? undefined,
      clientId: params.clientId ?? undefined
    });

    return {
      mode: "live",
      gateway: params.gateway,
      reference: intent.paymentIntentId,
      client_secret: intent.clientSecret,
      status: "initialized"
    };
  }

  const reference = `${params.gateway}_pos_${Date.now()}`;
  await queryDb(
    `insert into transactions (
       id, organization_id, booking_id, client_id, amount_cents, currency, status, payment_method, metadata
     ) values (
       gen_random_uuid(), $1, $2, $3, $4, $5, 'pending', 'card_present', $6::jsonb
     )`,
    [
      params.organizationId,
      params.bookingId ?? null,
      params.clientId ?? null,
      params.amountCents,
      params.currency.toLowerCase(),
      JSON.stringify({ provider: params.gateway, pos_reference: reference, mode: "external_capture" })
    ]
  );

  return {
    mode: "external_capture",
    gateway: params.gateway,
    reference,
    status: "initialized"
  };
}

export async function capturePosPayment(params: {
  organizationId: string;
  gateway: "stripe" | "flutterwave" | "paystack" | "paypal";
  reference: string;
  amountCents?: number | null;
}) {
  if (params.gateway === "stripe") {
    if (!isStripeConfigured()) {
      throw new Error("stripe_not_configured");
    }

    const stripe = getStripeClient();
    const intent = await stripe.paymentIntents.retrieve(params.reference);
    return {
      gateway: params.gateway,
      reference: intent.id,
      status: intent.status
    };
  }

  const rows = await queryDb<{ id: string }>(
    `update transactions
        set status = 'succeeded',
            processed_at = now(),
            metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('captured_via', $3)
      where organization_id = $1
        and metadata->>'pos_reference' = $2
      returning id::text`,
    [params.organizationId, params.reference, params.gateway]
  );

  if (!rows[0]) {
    throw new Error("pos_transaction_not_found");
  }

  return {
    gateway: params.gateway,
    reference: params.reference,
    status: "succeeded"
  };
}

export async function getReceiptByTransactionId(transactionId: string, organizationId: string) {
  const rows = await queryDb<{
    id: string;
    amount_cents: string;
    currency: string;
    status: string;
    processed_at: string | null;
    receipt_url: string | null;
    booking_id: string | null;
    client_id: string | null;
    provider: string | null;
  }>(
    `select id::text,
            amount_cents::text,
            currency,
            status,
            processed_at::text,
            receipt_url,
            booking_id::text,
            client_id::text,
            coalesce(metadata->>'provider', 'stripe') as provider
       from transactions
      where id = $1
        and organization_id = $2
      limit 1`,
    [transactionId, organizationId]
  );

  return rows[0] ?? null;
}

export async function createRefund(params: {
  organizationId: string;
  transactionId: string;
  amountCents: number;
  reason: "duplicate" | "fraudulent" | "requested_by_customer" | "service_not_provided";
  initiatedBy?: string | null;
}) {
  if (!isStripeConfigured()) {
    throw new Error("stripe_not_configured");
  }

  const stripe = getStripeClient();
  const transactionRows = await queryDb<{
    id: string;
    stripe_payment_intent_id: string | null;
    amount_cents: number;
    status: string;
  }>(
    `select id::text, stripe_payment_intent_id, amount_cents, status
       from transactions
      where organization_id = $1 and id = $2
      limit 1`,
    [params.organizationId, params.transactionId]
  );

  const transaction = transactionRows[0];
  if (!transaction) {
    throw new Error("transaction_not_found");
  }
  if (transaction.status !== "succeeded") {
    throw new Error("transaction_not_refundable");
  }
  if (!transaction.stripe_payment_intent_id) {
    throw new Error("missing_stripe_payment_intent");
  }
  if (params.amountCents > transaction.amount_cents) {
    throw new Error("refund_exceeds_transaction_amount");
  }

  const stripeReason =
    params.reason === "service_not_provided" ? "requested_by_customer" : params.reason;

  const refund = await stripe.refunds.create({
    payment_intent: transaction.stripe_payment_intent_id,
    amount: params.amountCents,
    reason: stripeReason
  });

  await queryDb(
    `insert into refunds (
       id, transaction_id, stripe_refund_id, amount, reason, status, initiated_by
     ) values (
       gen_random_uuid(), $1, $2, $3, $4, $5, $6
     )`,
    [
      transaction.id,
      refund.id,
      params.amountCents / 100,
      params.reason,
      refund.status === "succeeded" ? "succeeded" : "pending",
      params.initiatedBy ?? null
    ]
  );

  await queryDb(
    `update transactions
        set status = case when $2 >= amount_cents then 'refunded' else 'partially_refunded' end,
            processed_at = now()
      where id = $1`,
    [transaction.id, params.amountCents]
  );

  return {
    id: refund.id,
    status: refund.status,
    amount_cents: params.amountCents
  };
}

export async function markPaymentIntentSucceeded(params: {
  organizationId: string;
  paymentIntentId: string;
  paymentMethodId?: string | null;
  chargeId?: string | null;
  receiptUrl?: string | null;
}) {
  const client = await dbPool.connect();
  try {
    await client.query("begin");

    const result = await client.query<{
      id: string;
      invoice_id: string | null;
      booking_id: string | null;
      client_id: string | null;
    }>(
      `update transactions
          set status = 'succeeded',
              stripe_payment_method_id = coalesce($3, stripe_payment_method_id),
              stripe_charge_id = coalesce($4, stripe_charge_id),
              receipt_url = coalesce($5, receipt_url),
              processed_at = now(),
              failure_code = null,
              failure_message = null
        where organization_id = $1
          and stripe_payment_intent_id = $2
        returning id::text, invoice_id::text, booking_id::text, client_id::text`,
      [params.organizationId, params.paymentIntentId, params.paymentMethodId ?? null, params.chargeId ?? null, params.receiptUrl ?? null]
    );

    const transaction = result.rows[0];
    if (!transaction) {
      await client.query("rollback");
      return null;
    }

    if (transaction.invoice_id) {
      await client.query(`update invoices set status = 'paid' where id = $1`, [transaction.invoice_id]);
    }
    if (transaction.booking_id) {
      await client.query(`update bookings set deposit_paid = true, updated_at = now() where id = $1`, [transaction.booking_id]);
    }

    await client.query(
      `insert into audit_logs (id, organization_id, actor_id, action, metadata)
       values (gen_random_uuid(), $1, null, 'payment.succeeded', $2::jsonb)`,
      [params.organizationId, JSON.stringify({ payment_intent_id: params.paymentIntentId, transaction_id: transaction.id })]
    );

    await client.query("commit");
    return transaction;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function markPaymentIntentFailed(params: {
  organizationId: string;
  paymentIntentId: string;
  failureCode?: string | null;
  failureMessage?: string | null;
}) {
  const rows = await queryDb<{ id: string; client_id: string | null }>(
    `update transactions
        set status = 'failed',
            failure_code = $3,
            failure_message = $4,
            processed_at = now()
      where organization_id = $1
        and stripe_payment_intent_id = $2
      returning id::text, client_id::text`,
    [params.organizationId, params.paymentIntentId, params.failureCode ?? null, params.failureMessage ?? null]
  );

  return rows[0] ?? null;
}

export async function handleSubscriptionDeleted(organizationId: string, stripeSubscriptionId: string) {
  await queryDb(
    `update subscriptions
        set status = 'canceled',
            canceled_at = now()
      where organization_id = $1
        and stripe_subscription_id = $2`,
    [organizationId, stripeSubscriptionId]
  );
}

export async function listTransactions(organizationId: string, filters: Record<string, string | undefined>) {
  const conditions = ["organization_id = $1"];
  const params: Array<string> = [organizationId];

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }

  if (filters.method) {
    params.push(filters.method);
    conditions.push(`payment_method = $${params.length}`);
  }

  if (filters.start_date) {
    params.push(filters.start_date);
    conditions.push(`created_at >= $${params.length}::timestamptz`);
  }

  if (filters.end_date) {
    params.push(filters.end_date);
    conditions.push(`created_at <= $${params.length}::timestamptz`);
  }

  return queryDb(
    `select
        id,
        organization_id::text,
        invoice_id,
        booking_id,
        client_id,
        stripe_payment_intent_id,
        amount_cents,
        currency,
        status,
        payment_method,
        receipt_url,
        processed_at,
        created_at
       from transactions
      where ${conditions.join(" and ")}
      order by created_at desc
      limit 100`,
    params
  );
}

export async function getRevenueCycleMetrics(organizationId: string) {
  const rows = await queryDb<{
    total_invoices: string;
    paid_invoices: string;
    total_billed_cents: string | null;
    total_paid_cents: string | null;
    denied_claims: string;
    total_claims: string;
  }>(
    `select
        count(*)::text as total_invoices,
        count(*) filter (where status = 'paid')::text as paid_invoices,
        coalesce(sum(amount_cents), 0)::text as total_billed_cents,
        coalesce(sum(case when status = 'paid' then amount_cents else 0 end), 0)::text as total_paid_cents,
        (
          select count(*)::text
            from insurance_claims
           where organization_id = $1
             and status = 'denied'
        ) as denied_claims,
        (
          select count(*)::text
            from insurance_claims
           where organization_id = $1
        ) as total_claims
       from invoices
      where organization_id = $1`,
    [organizationId]
  );

  const summary = rows[0];
  const totalInvoices = Number(summary?.total_invoices ?? 0);
  const paidInvoices = Number(summary?.paid_invoices ?? 0);
  const totalBilled = Number(summary?.total_billed_cents ?? 0);
  const totalPaid = Number(summary?.total_paid_cents ?? 0);
  const totalClaims = Number(summary?.total_claims ?? 0);
  const deniedClaims = Number(summary?.denied_claims ?? 0);

  return {
    days_in_ar: 14,
    collection_rate: totalInvoices > 0 ? Number(((paidInvoices / totalInvoices) * 100).toFixed(2)) : 0,
    denial_rate: totalClaims > 0 ? Number(((deniedClaims / totalClaims) * 100).toFixed(2)) : 0,
    net_collection_pct: totalBilled > 0 ? Number(((totalPaid / totalBilled) * 100).toFixed(2)) : 0,
    outstanding_by_age: {
      "0_30": Math.max(totalBilled - totalPaid, 0),
      "31_60": 0,
      "61_90": 0,
      over_90: 0
    }
  };
}
