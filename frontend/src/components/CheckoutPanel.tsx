import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder';
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

function getAuthToken(): string {
  return localStorage.getItem("kora_token") ?? import.meta.env.VITE_DEV_BEARER_TOKEN ?? "";
}

function getOrgId(): string {
  return localStorage.getItem("kora_org_id") ?? import.meta.env.VITE_ORG_ID ?? "org_placeholder";
}

interface CheckoutPanelProps {
  amount: number;
  currency?: string;
  invoiceId?: string;
  bookingId?: string;
  clientId?: string;
  description?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

let stripePromise: Promise<Stripe | null> | null = null;

function getStripePromise() {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
}

function CheckoutForm({
  amount,
  currency = 'gbp',
  invoiceId,
  bookingId,
  clientId,
  description,
  onSuccess,
  onError
}: CheckoutPanelProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Fetch client secret from backend
  useEffect(() => {
    const fetchClientSecret = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/payments/intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
            'X-Organization-Id': getOrgId(),
            'X-Org-Id': getOrgId()
          },
          body: JSON.stringify({
            amount_cents: Math.round(amount * 100),
            currency,
            invoice_id: invoiceId,
            booking_id: bookingId,
            client_id: clientId
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.client_secret);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Payment setup failed');
        onError?.(error instanceof Error ? error.message : 'Payment setup failed');
      }
    };

    if (amount > 0) {
      fetchClientSecret();
    }
  }, [amount, currency, invoiceId, bookingId, clientId, onError]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setErrorMessage('Payment processing not ready');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {}
        }
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        onError?.(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        await fetch(`${API_BASE}/api/payments/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
            'X-Organization-Id': getOrgId(),
            'X-Org-Id': getOrgId()
          },
          body: JSON.stringify({
            payment_intent_id: paymentIntent.id
          })
        });

        onSuccess?.(paymentIntent.id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment processing error';
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        padding: '16px',
        borderRadius: 8,
        border: '1px solid var(--color-border)',
        background: 'var(--color-background-card)'
      }}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
          Card Details
        </label>
        <CardElement
          options={{
            style: {
              base: {
                color: 'var(--color-text-primary)',
                fontFamily: 'inherit',
                fontSize: '14px',
                '::placeholder': {
                  color: 'var(--color-text-tertiary)'
                }
              },
              invalid: {
                color: 'var(--color-danger)'
              }
            }
          }}
        />
      </div>

      {errorMessage && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          background: 'rgba(220, 38, 38, 0.1)',
          color: 'var(--color-danger)',
          fontSize: 12
        }}>
          {errorMessage}
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTop: '1px solid var(--color-border)'
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Total to pay</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-accent-teal)' }}>
            £{amount.toFixed(2)}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !stripe || !clientSecret}
          style={{
            padding: '12px 24px',
            borderRadius: 8,
            border: 'none',
            background: isLoading || !stripe || !clientSecret ? 'var(--color-border)' : 'var(--color-accent-teal)',
            color: isLoading || !stripe || !clientSecret ? 'var(--color-text-tertiary)' : '#0a0c12',
            fontWeight: 700,
            cursor: isLoading || !stripe || !clientSecret ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            minWidth: 140
          }}
        >
          {isLoading ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </form>
  );
}

export default function CheckoutPanel(props: CheckoutPanelProps) {
  const stripePromise = getStripePromise();

  return (
    <div style={{
      padding: '24px',
      borderRadius: 12,
      border: '1px solid var(--color-border)',
      background: 'var(--color-background-card)'
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--color-text-primary)' }}>
        {props.description || 'Complete Payment'}
      </h3>

      <Elements stripe={stripePromise}>
        <CheckoutForm {...props} />
      </Elements>
    </div>
  );
}
