import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDiscoveryCategories,
  getFeaturedVenues,
  searchVenues,
  type DiscoveryCategory,
  type DiscoveryVenue
} from "../../services/api";
import { ActionButton, AudienceSection, EmptyState, formatMoney } from "../../components/audience/AudiencePrimitives";

const DEFAULT_CITY = "London";

export function BookingFlowPage() {
  const [city, setCity] = useState(DEFAULT_CITY);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [categories, setCategories] = useState<DiscoveryCategory[]>([]);
  const [featured, setFeatured] = useState<DiscoveryVenue[]>([]);
  const [results, setResults] = useState<DiscoveryVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      setError(null);
      try {
        const [categoryResponse, featuredResponse] = await Promise.all([
          getDiscoveryCategories(),
          getFeaturedVenues(city)
        ]);
        if (cancelled) {
          return;
        }
        setCategories(categoryResponse.categories);
        setFeatured(featuredResponse.venues);
      } catch {
        if (!cancelled) {
          setError("Discovery is warming up. Featured venues will appear once the backend data is available.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, [city]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (!query.trim() && !category) {
        setResults([]);
        return;
      }

      setSearching(true);
      try {
        const response = await searchVenues({
          q: query.trim() || undefined,
          city,
          category: category || undefined
        });
        if (!cancelled) {
          setResults(response.venues);
        }
      } catch {
        if (!cancelled) {
          setError("Search is unavailable for the moment. Try again in a few seconds.");
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, category, city]);

  const visibleVenues = useMemo(() => (results.length > 0 || query || category ? results : featured), [results, query, category, featured]);

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: "0.12em", color: "var(--color-accent)", fontWeight: 700, textTransform: "uppercase" }}>
            Client Booking
          </div>
          <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)" }}>Find a venue and start booking</div>
        </div>
        <Link to="/app/client" style={{ color: "var(--color-accent)", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
          Back to client workspace
        </Link>
      </div>

      <AudienceSection title="Search" meta="Discovery">
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0, 1fr)", gap: 12 }}>
            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              style={{
                borderRadius: 14,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface-2)",
                color: "var(--color-text-primary)",
                padding: "12px 14px"
              }}
            >
              {["London", "Lagos", "Abuja", "Port Harcourt", "Dubai"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for massage, balayage, manicure, recovery..."
              style={{
                borderRadius: 14,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface-2)",
                color: "var(--color-text-primary)",
                padding: "12px 14px"
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory((current) => (current === item.slug ? "" : item.slug))}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  textAlign: "left",
                  border: category === item.slug ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                  background: category === item.slug ? "var(--color-accent-dim)" : "var(--color-surface-2)",
                  cursor: "pointer"
                }}
              >
                <div style={{ fontSize: 22 }}>{item.icon ?? "•"}</div>
                <div style={{ marginTop: 8, fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" }}>{item.label}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: "var(--color-text-muted)" }}>{item.venue_count} venues</div>
              </button>
            ))}
          </div>
        </div>
      </AudienceSection>

      <AudienceSection title={query || category ? "Search Results" : "Featured Venues"} meta={city}>
        {loading || searching ? (
          <div style={{ fontSize: 14, color: "var(--color-text-muted)" }}>Loading discovery data...</div>
        ) : error ? (
          <EmptyState title="Discovery is offline" detail={error} />
        ) : visibleVenues.length === 0 ? (
          <EmptyState title="No venues found" detail={`No venues found in ${city}. Try a different category or city.`} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {visibleVenues.map((venue) => (
              <div
                key={venue.id}
                style={{
                  padding: 18,
                  borderRadius: 18,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface-2)",
                  display: "grid",
                  gap: 10
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>{venue.display_name}</div>
                  <div style={{ marginTop: 6, fontSize: 13, color: "var(--color-text-muted)" }}>
                    {venue.city ?? city} · {venue.rating.toFixed(1)} rating · {venue.review_count} reviews
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {venue.matching_services.slice(0, 3).map((service) => (
                    <div
                      key={`${venue.id}-${service.name}`}
                      style={{
                        borderRadius: 999,
                        padding: "6px 10px",
                        background: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                        color: "var(--color-accent)",
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      {service.name}
                    </div>
                  ))}
                </div>
                <Link to={`/app/venues/${venue.slug}`} style={{ textDecoration: "none" }}>
                  <ActionButton tone="accent">View venue</ActionButton>
                </Link>
              </div>
            ))}
          </div>
        )}
      </AudienceSection>
    </div>
  );
}
