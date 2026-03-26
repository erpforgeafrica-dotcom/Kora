import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getDiscoveryCategories, searchVenues, type DiscoveryCategory, type DiscoveryVenue } from "../services/api";

export function SearchResultsPage() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState<DiscoveryCategory[]>([]);
  const [results, setResults] = useState<DiscoveryVenue[]>([]);
  const [loading, setLoading] = useState(true);

  const query = params.get("q") ?? "";
  const city = params.get("city") ?? "";
  const category = params.get("category") ?? "";

  useEffect(() => {
    void getDiscoveryCategories()
      .then((response) => setCategories(response.categories))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const response = await searchVenues({
          q: query || undefined,
          city: city || undefined,
          category: category || undefined
        });
        if (!cancelled) {
          setResults(response.venues);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [query, city, category]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)", padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "280px minmax(0, 1fr)", gap: 16 }}>
        <aside style={{ borderRadius: 20, border: "1px solid var(--color-border)", background: "var(--color-surface)", padding: 18, height: "fit-content" }}>
          <div style={{ fontSize: 12, letterSpacing: "0.12em", color: "var(--color-accent)", fontWeight: 700, textTransform: "uppercase" }}>
            Search Filters
          </div>
          <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
            <input
              value={city}
              onChange={(event) => setParams({ q: query, city: event.target.value, category })}
              placeholder="City"
              style={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-surface-2)", color: "var(--color-text-primary)", padding: "10px 12px" }}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {categories.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setParams({ q: query, city, category: category === item.slug ? "" : item.slug })}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 999,
                    border: category === item.slug ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                    background: category === item.slug ? "var(--color-accent-dim)" : "var(--color-surface-2)",
                    color: category === item.slug ? "var(--color-accent)" : "var(--color-text-secondary)",
                    cursor: "pointer"
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section style={{ display: "grid", gap: 16 }}>
          <div style={{ borderRadius: 20, border: "1px solid var(--color-border)", background: "var(--color-surface)", padding: 18 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)" }}>Search results</div>
            <div style={{ marginTop: 8, fontSize: 14, color: "var(--color-text-muted)" }}>
              {loading ? "Searching..." : `${results.length} venues`} {city ? `in ${city}` : ""} {query ? `for "${query}"` : ""}
            </div>
          </div>

          {loading ? (
            <div style={{ fontSize: 14, color: "var(--color-text-muted)" }}>Loading venues...</div>
          ) : results.length === 0 ? (
            <div style={{ borderRadius: 20, border: "1px solid var(--color-border)", background: "var(--color-surface)", padding: 18, color: "var(--color-text-muted)" }}>
              No venues match your filters.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              {results.map((venue) => (
                <div key={venue.id} style={{ borderRadius: 20, border: "1px solid var(--color-border)", background: "var(--color-surface)", padding: 18 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>{venue.display_name}</div>
                  <div style={{ marginTop: 6, fontSize: 13, color: "var(--color-text-muted)" }}>
                    {venue.city ?? "City pending"} · {venue.rating.toFixed(1)} rating · {venue.review_count} reviews
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    {venue.matching_services.slice(0, 3).map((service) => (
                      <div key={`${venue.id}-${service.name}`} style={{ padding: "6px 10px", borderRadius: 999, background: "var(--color-accent-dim)", color: "var(--color-accent)", fontSize: 12 }}>
                        {service.name}
                      </div>
                    ))}
                  </div>
                  <Link to={`/app/venues/${venue.slug}`} style={{ display: "inline-block", marginTop: 14, color: "var(--color-accent)", fontWeight: 700, textDecoration: "none" }}>
                    View venue
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
