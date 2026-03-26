import { useCrud } from "@/hooks/useCrud";
import PageLayout from "@/components/ui/PageLayout";
import DataTable from "@/components/ui/DataTable";
import Skeleton from "@/components/ui/Skeleton";
import AIInsightCard from "@/components/ai/AIInsightCard";

interface Review {
  id: string;
  client_name: string;
  rating: number;
  content: string;
  ai_sentiment: 'positive' | 'negative' | 'neutral';
  created_at: string;
}

export default function ReviewsPage() {
  const { data, loading, error } = useCrud<Review>("/api/reviews");

  if (loading) return <Skeleton rows={6} />;
  if (error) return <div className="p-6 text-amber-400">Error loading reviews: {error}</div>;

  const negativeCount = data?.filter(r => r.ai_sentiment === 'negative').length || 0;
  const totalCount = data?.length || 0;
  const ratio = totalCount > 0 ? (negativeCount / totalCount).toFixed(2) : '0';

  return (
    <PageLayout title="Customer Reviews">
      <div style={{ marginBottom: '24px' }}>
        <AIInsightCard
          title="Review Sentiment"
          content={`${negativeCount} negative reviews (${ratio} ratio). Rule: Show max 1:10 ratio on public profile.`}
          icon="⭐"
        />
      </div>

      {!data?.length ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
          No reviews yet
        </div>
      ) : (
        <DataTable
          columns={[
            { accessorKey: "client_name", header: "Client" },
            { accessorKey: "rating", header: "Rating" },
            { accessorKey: "ai_sentiment", header: "Sentiment" },
            { accessorKey: "created_at", header: "Date" },
          ]}
          data={data}
        />
      )}
    </PageLayout>
  );
}
