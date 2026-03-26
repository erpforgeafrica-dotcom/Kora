import { useState } from "react";

interface POSPaymentModalProps {
  bookingId: string;
  amount: number;
  clientName: string;
  serviceName: string;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentStep = 1 | 2 | 3 | 4 | 5;

export function POSPaymentModal({
  bookingId,
  amount,
  clientName,
  serviceName,
  onClose,
  onSuccess
}: POSPaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>(1);
  const [selectedGateway, setSelectedGateway] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState(amount.toFixed(2));
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any>(null);

  const gateways = [
    { id: "stripe", name: "Stripe", icon: "💳" },
    { id: "paypal", name: "PayPal", icon: "🅿️" },
    { id: "square", name: "Square", icon: "⬜" },
    { id: "cash", name: "Cash", icon: "💵" }
  ];

  const handleGatewaySelect = (gatewayId: string) => {
    setSelectedGateway(gatewayId);
    setStep(2);
  };

  const handleAmountConfirm = () => {
    if (parseFloat(paymentAmount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    setStep(3);
  };

  const handlePaymentProcess = async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          gateway: selectedGateway,
          amount: parseFloat(paymentAmount)
        })
      });

      if (!response.ok) throw new Error("Payment processing failed");
      const data = await response.json();
      setReceipt(data);
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStep(4);
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = () => {
    onSuccess();
    onClose();
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000
    }}>
      <div style={{
        background: "var(--color-surface)",
        borderRadius: 12,
        padding: 24,
        maxWidth: 500,
        width: "90%",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
      }}>
        {/* Steps Indicator */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
          padding: "0 0 16px 0",
          borderBottom: "1px solid var(--color-border)"
        }}>
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: step >= s ? "var(--color-accent)" : "var(--color-surface-2)",
                border: `2px solid ${step >= s ? "var(--color-accent)" : "var(--color-border)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: step >= s ? "#0c0e14" : "var(--color-text-muted)",
                fontSize: 12,
                fontWeight: 700
              }}>
                {step > s ? "✓" : s}
              </div>
              {s < 5 && (
                <div style={{
                  width: 16,
                  height: 2,
                  background: step > s ? "var(--color-accent)" : "var(--color-border)",
                  margin: "0 8px"
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Gateway */}
        {step === 1 && (
          <div style={{ display: "grid", gap: 16 }}>
            <h3 style={{ color: "var(--color-text-primary)", margin: "0 0 8px 0", fontSize: 16 }}>
              Select Payment Method
            </h3>
            <div style={{ display: "grid", gap: 12 }}>
              {gateways.map(gateway => (
                <button
                  key={gateway.id}
                  onClick={() => handleGatewaySelect(gateway.id)}
                  style={{
                    padding: "16px",
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    color: "var(--color-text-primary)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    transition: "all 200ms"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-surface)";
                    e.currentTarget.style.borderColor = "var(--color-accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--color-surface-2)";
                    e.currentTarget.style.borderColor = "var(--color-border)";
                  }}
                >
                  <span style={{ fontSize: 20 }}>{gateway.icon}</span>
                  {gateway.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Confirm Amount */}
        {step === 2 && (
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <h3 style={{ color: "var(--color-text-primary)", margin: "0 0 8px 0", fontSize: 16 }}>
                Review Amount
              </h3>
              <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: 13 }}>
                Method: {gateways.find(g => g.id === selectedGateway)?.name}
              </p>
            </div>
            <div style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: 16,
              display: "grid",
              gap: 12
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--color-text-muted)" }}>Client:</span>
                <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{clientName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--color-text-muted)" }}>Service:</span>
                <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{serviceName}</span>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 16,
                fontWeight: 700,
                paddingTop: 12,
                borderTop: "1px solid var(--color-border)"
              }}>
                <span style={{ color: "var(--color-text-muted)" }}>Amount:</span>
                <span style={{ color: "var(--color-accent)" }}>${paymentAmount}</span>
              </div>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                Adjust Amount (if needed)
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                step="0.01"
                min="0"
                style={{
                  padding: "10px 12px",
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  color: "var(--color-text-primary)",
                  fontSize: 14,
                  fontFamily: "inherit"
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  color: "var(--color-text-muted)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Back
              </button>
              <button
                onClick={handleAmountConfirm}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "var(--color-accent)",
                  border: "none",
                  borderRadius: 6,
                  color: "#0c0e14",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 3 && (
          <div style={{ display: "grid", gap: 16, textAlign: "center" }}>
            <h3 style={{ color: "var(--color-text-primary)", margin: 0, fontSize: 16 }}>
              Process Payment
            </h3>
            <div style={{
              padding: "32px 0",
              fontSize: 48,
              animation: "pulse 1.5s infinite"
            }}>
              💳
            </div>
            <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: 13 }}>
              Processing ${paymentAmount}...
            </p>
            <button
              onClick={handlePaymentProcess}
              disabled={processing}
              style={{
                padding: "10px",
                background: "var(--color-accent)",
                border: "none",
                borderRadius: 6,
                color: "#0c0e14",
                fontSize: 13,
                fontWeight: 600,
                cursor: processing ? "not-allowed" : "pointer",
                opacity: processing ? 0.6 : 1
              }}
            >
              {processing ? "Processing..." : "Confirm Payment"}
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={processing}
              style={{
                padding: "10px",
                background: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                color: "var(--color-text-muted)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Step 4: Error State */}
        {step === 4 && (
          <div style={{ display: "grid", gap: 16, textAlign: "center" }}>
            <h3 style={{ color: "var(--color-danger)", margin: 0, fontSize: 16 }}>
              Payment Failed
            </h3>
            <div style={{ fontSize: 48, margin: "16px 0" }}>❌</div>
            <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: 13 }}>
              {error || "An error occurred during payment processing"}
            </p>
            <button
              onClick={() => setStep(2)}
              style={{
                padding: "10px 20px",
                background: "var(--color-accent)",
                border: "none",
                borderRadius: 6,
                color: "#0c0e14",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Step 5: Success / Receipt */}
        {step === 5 && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <h3 style={{ color: "var(--color-text-primary)", margin: "0 0 8px 0", fontSize: 16 }}>
                Payment Successful
              </h3>
              <div style={{ fontSize: 48, margin: "16px 0" }}>✅</div>
            </div>
            <div style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: 16,
              display: "grid",
              gap: 12,
              fontSize: 13
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Transaction ID:</span>
                <span style={{ color: "var(--color-text-primary)", fontFamily: "monospace" }}>
                  {receipt?.transactionId || "TXN-" + Date.now()}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Amount:</span>
                <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
                  ${paymentAmount}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Method:</span>
                <span style={{ color: "var(--color-text-primary)" }}>
                  {gateways.find(g => g.id === selectedGateway)?.name}
                </span>
              </div>
            </div>
            <button
              onClick={handleComplete}
              style={{
                padding: "12px",
                background: "var(--color-accent)",
                border: "none",
                borderRadius: 6,
                color: "#0c0e14",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Complete & Close
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
