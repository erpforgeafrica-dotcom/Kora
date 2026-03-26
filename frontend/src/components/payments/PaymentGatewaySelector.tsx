import { useEffect, useState } from "react";

interface PaymentMethod {
  provider: string;
  status: string;
  currencies: string[];
}

export function PaymentGatewaySelector({ onSelect }: { onSelect: (provider: string) => void }) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    fetch("/api/payments/multi/available")
      .then(res => res.json())
      .then(data => {
        setMethods(data.available_methods || []);
        setSelected(data.default_provider || "stripe");
        onSelect(data.default_provider || "stripe");
      })
      .catch(err => console.error(err));
  }, [onSelect]);

  const logos: Record<string, string> = {
    stripe: "💳",
    paypal: "🅿️",
    flutterwave: "🦋",
    paystack: "📦"
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 12 }}>
        Select Payment Method
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        {methods.map((method) => (
          <button
            key={method.provider}
            onClick={() => { setSelected(method.provider); onSelect(method.provider); }}
            style={{
              padding: 16,
              borderRadius: 12,
              border: selected === method.provider ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
              background: selected === method.provider ? "var(--color-accent-dim)" : "var(--color-surface-2)",
              cursor: "pointer",
              textAlign: "center"
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>{logos[method.provider] || "💰"}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", textTransform: "capitalize", marginBottom: 6 }}>
              {method.provider}
            </div>
            <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
              {method.currencies.slice(0, 3).map((currency) => (
                <span key={currency} style={{ fontSize: 10, color: "var(--color-text-muted)" }}>
                  {currency}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
