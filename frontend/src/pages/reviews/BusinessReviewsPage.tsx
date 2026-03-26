import { useEffect, useState } from "react";
import { AudienceSection, EmptyState, StatusPill } from "../../components/audience/AudiencePrimitives";

interface Review {
  id: string;
  rating: number;
  content: string;
  client_name: string;
  status: string;
  resolution_status: string | null;
  created_at: string;
  responses: Array<{ content: string; created_at: string }> | null;
}

export function BusinessReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ positive_count: 0, negative_count: 0, avg_rating: "0.0" });
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const res = await fetch("/api/reviews/admin", {
        headers: { "X-Org-Id": localStorage.getItem("kora_org_id") || "" }
      });
      const data = await res.json();
      setReviews(data.reviews || []);
      
      // Calculate stats
      const published = data.reviews.filter((r: Review) => r.status === "published");
      const positive = published.filter((r: Review) => r.rating >= 4).length;
      const negative = published.filter((r: Review) => r.rating <= 2).length;
      const avg = published.length > 0
        ? (published.reduce((sum: number, r: Review) => sum + r.rating, 0) / published.length).toFixed(1)
        : "0.0";
      
      setStats({ positive_count: positive, negative_count: negative, avg_rating: avg });
    } catch (err) {
      console.error("Failed to load reviews", err);
    }
  };

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) return;

    try {
      await fetch(`/api/reviews/${reviewId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Org-Id": localStorage.getItem("kora_org_id") || ""
        },
        body: JSON.stringify({ content: responseText })
      });

      setRespondingTo(null);
      setResponseText("");
      await loadReviews();
    } catch (err) {
      console.error("Failed to respond", err);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? "#ffd700" : "var(--color-border)", fontSize: 18 }}>
        ★
      </span>
    ));
  };

  const responseRate = reviews.length > 0
    ? ((reviews.filter(r => r.resolution_status === "responded").length / reviews.length) * 100).toFixed(0)
    : "0";

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8 }}>
          Customer Reviews
        </div>
        <div style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
          Manage feedback and respond to customer reviews
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 20, borderRadius: 14, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 8 }}>Average Rating</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text-primary)" }}>
            {stats.avg_rating} ★
          </div>
        </div>
        <div style={{ padding: 20, borderRadius: 14, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 8 }}>Total Reviews</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text-primary)" }}>
            {reviews.length}
          </div>
        </div>
        <div style={{ padding: 20, borderRadius: 14, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 8 }}>Response Rate</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text-primary)" }}>
            {responseRate}%
          </div>
        </div>
      </div>

      <div style={{ padding: 16, borderRadius: 12, background: "color-mix(in srgb, var(--color-warning) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--color-warning) 28%, transparent)", marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: "var(--color-warning)", lineHeight: 1.6 }}>
          ℹ️ Negative reviews are limited to 1:10 ratio on your public profile. Currently showing {stats.negative_count} negative reviews (limit: {Math.floor(stats.positive_count / 10)}).
          You cannot delete reviews, but you can respond to address concerns.
        </div>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          detail="Customer reviews will appear here after completed bookings"
        />
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {reviews.map((review) => (
            <div
              key={review.id}
              style={{
                padding: 18,
                borderRadius: 14,
                background: "var(--color-surface-2)",
                border: review.rating <= 2 && review.status === "flagged" ? "1px solid var(--color-warning)" : "1px solid var(--color-border)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" }}>
                      {review.client_name || "Anonymous"}
                    </div>
                    {review.status === "flagged" && <StatusPill label="Flagged" tone="warning" />}
                    {review.resolution_status === "responded" && <StatusPill label="Responded" tone="success" />}
                  </div>
                  <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>
                    {renderStars(review.rating)}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {review.content && (
                <div style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: 12 }}>
                  {review.content}
                </div>
              )}

              {review.responses && review.responses.length > 0 && (
                <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-accent)", marginBottom: 6 }}>
                    Your Response
                  </div>
                  {review.responses.map((resp, i) => (
                    <div key={i} style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                      {resp.content}
                    </div>
                  ))}
                </div>
              )}

              {!review.responses && review.rating <= 2 && (
                <div style={{ marginTop: 12 }}>
                  {respondingTo === review.id ? (
                    <div>
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Write your response..."
                        style={{
                          width: "100%",
                          minHeight: 80,
                          padding: 12,
                          borderRadius: 8,
                          border: "1px solid var(--color-border)",
                          background: "var(--color-surface)",
                          color: "var(--color-text-primary)",
                          fontSize: 13,
                          fontFamily: "inherit",
                          resize: "vertical"
                        }}
                      />
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button
                          onClick={() => handleRespond(review.id)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: 8,
                            border: "1px solid var(--color-accent)",
                            background: "var(--color-accent)",
                            color: "white",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          Send Response
                        </button>
                        <button
                          onClick={() => {
                            setRespondingTo(null);
                            setResponseText("");
                          }}
                          style={{
                            padding: "8px 16px",
                            borderRadius: 8,
                            border: "1px solid var(--color-border)",
                            background: "var(--color-surface-2)",
                            color: "var(--color-text-muted)",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRespondingTo(review.id)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "1px solid var(--color-accent)",
                        background: "var(--color-accent-dim)",
                        color: "var(--color-accent)",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Respond to Review
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
