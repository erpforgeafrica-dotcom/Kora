import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import paypal from "@paypal/checkout-server-sdk";
import Flutterwave from "flutterwave-node-v3";

export const multiPaymentRoutes = Router();

function getPayPalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const environment = process.env.PAYPAL_MODE === "live" 
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);
  return new paypal.core.PayPalHttpClient(environment);
}

function getFlutterwaveClient() {
  return new Flutterwave(process.env.FLUTTERWAVE_PUBLIC_KEY!, process.env.FLUTTERWAVE_SECRET_KEY!);
}

multiPaymentRoutes.post("/paypal/create-order", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { amount_cents, currency = "USD", booking_id } = req.body;

    if (!process.env.PAYPAL_CLIENT_ID) {
      return res.status(503).json({ error: { code: "PAYPAL_NOT_CONFIGURED", message: "paypal not configured" } });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: (amount_cents / 100).toFixed(2)
        },
        custom_id: booking_id
      }]
    });

    const client = getPayPalClient();
    const order = await client.execute(request);

    return res.json({
      provider: "paypal",
      order_id: order.result.id,
      amount_cents,
      currency,
      status: "pending"
    });
  } catch (err) {
    return next(err);
  }
});

multiPaymentRoutes.post("/paypal/capture", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { order_id } = req.body;

    const request = new paypal.orders.OrdersCaptureRequest(order_id);
    request.requestBody({});

    const client = getPayPalClient();
    const capture = await client.execute(request);

    await queryDb(
      `INSERT INTO payment_transactions (organization_id, provider, provider_transaction_id, amount_cents, currency, status)
       VALUES ($1, 'paypal', $2, $3, $4, 'completed')`,
      [organizationId, order_id, parseInt(capture.result.purchase_units[0].amount.value) * 100, capture.result.purchase_units[0].amount.currency_code]
    );

    return res.json({ captured: true, order_id, provider: "paypal" });
  } catch (err) {
    return next(err);
  }
});

multiPaymentRoutes.post("/flutterwave/initialize", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { amount_cents, currency = "NGN", email, booking_id } = req.body;

    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
      return res.status(503).json({ error: { code: "FLUTTERWAVE_NOT_CONFIGURED", message: "flutterwave not configured" } });
    }

    const flw = getFlutterwaveClient();
    const payload = {
      tx_ref: `KORA_${organizationId}_${Date.now()}`,
      amount: (amount_cents / 100).toString(),
      currency,
      redirect_url: `${req.protocol}://${req.get("host")}/api/payments/multi/flutterwave/callback`,
      customer: { email },
      customizations: { title: "KORA Payment", description: `Booking ${booking_id}` }
    };

    const response = await flw.Charge.card(payload);

    return res.json({
      provider: "flutterwave",
      tx_ref: payload.tx_ref,
      payment_link: response.data.link,
      amount_cents,
      currency,
      status: "pending"
    });
  } catch (err) {
    return next(err);
  }
});

multiPaymentRoutes.post("/flutterwave/verify", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { transaction_id } = req.body;

    const flw = getFlutterwaveClient();
    const response = await flw.Transaction.verify({ id: transaction_id });

    if (response.data.status === "successful") {
      await queryDb(
        `INSERT INTO payment_transactions (organization_id, provider, provider_transaction_id, amount_cents, currency, status)
         VALUES ($1, 'flutterwave', $2, $3, $4, 'completed')`,
        [organizationId, transaction_id, parseInt(response.data.amount) * 100, response.data.currency]
      );
    }

    return res.json({ verified: true, transaction_id, provider: "flutterwave", status: response.data.status });
  } catch (err) {
    return next(err);
  }
});

multiPaymentRoutes.post("/paystack/initialize", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { amount_cents, email, booking_id } = req.body;

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(503).json({ error: { code: "PAYSTACK_NOT_CONFIGURED", message: "paystack not configured" } });
    }

    const reference = `KORA_${organizationId}_${Date.now()}`;
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: amount_cents,
        reference,
        callback_url: `${req.protocol}://${req.get("host")}/api/payments/multi/paystack/callback`
      })
    });

    const data = await response.json();

    return res.json({
      provider: "paystack",
      reference,
      authorization_url: data.data.authorization_url,
      amount_cents,
      currency: "NGN",
      status: "pending"
    });
  } catch (err) {
    return next(err);
  }
});

multiPaymentRoutes.post("/paystack/verify", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { reference } = req.body;

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });

    const data = await response.json();

    if (data.data.status === "success") {
      await queryDb(
        `INSERT INTO payment_transactions (organization_id, provider, provider_transaction_id, amount_cents, currency, status)
         VALUES ($1, 'paystack', $2, $3, 'NGN', 'completed')`,
        [organizationId, reference, data.data.amount]
      );
    }

    return res.json({ verified: true, reference, provider: "paystack", status: data.data.status });
  } catch (err) {
    return next(err);
  }
});

multiPaymentRoutes.get("/available", async (req, res) => {
  const methods = [];

  if (process.env.STRIPE_SECRET_KEY) {
    methods.push({ provider: "stripe", status: "active", currencies: ["USD", "EUR", "GBP"] });
  }

  if (process.env.PAYPAL_CLIENT_ID) {
    methods.push({ provider: "paypal", status: "active", currencies: ["USD", "EUR", "GBP"] });
  }

  if (process.env.FLUTTERWAVE_SECRET_KEY) {
    methods.push({ provider: "flutterwave", status: "active", currencies: ["NGN", "USD", "GHS", "KES"] });
  }

  if (process.env.PAYSTACK_SECRET_KEY) {
    methods.push({ provider: "paystack", status: "active", currencies: ["NGN", "GHS", "ZAR"] });
  }

  return res.json({
    available_methods: methods,
    default_provider: methods[0]?.provider || "stripe"
  });
});

