/**
 * AI Insight Unit Tests
 * Tests non-blocking AI insight panels across all roles
 * Ensures panel failures never crash main page
 */

import { render, screen, waitFor } from '@testing-library/react';
import AIInsightCard from '@/components/ai/AIInsightCard';

describe('AIInsightCard Component', () => {
  describe('Rendering', () => {
    it('should render card with title and content', () => {
      render(
        <AIInsightCard
          title="Test Insight"
          content="This is a test insight"
          icon="🧠"
        />
      );

      expect(screen.getByText('Test Insight')).toBeInTheDocument();
      expect(screen.getByText('This is a test insight')).toBeInTheDocument();
    });

    it('should render custom icon', () => {
      const { container } = render(
        <AIInsightCard
          title="Revenue"
          content="$5,000 this month"
          icon="💰"
        />
      );

      expect(container.textContent).toContain('💰');
    });

    it('should render default icon if not provided', () => {
      const { container } = render(
        <AIInsightCard
          title="Default"
          content="No custom icon"
        />
      );

      expect(container.textContent).toContain('🧠'); // Default brain icon
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton', () => {
      render(
        <AIInsightCard
          title="Loading Test"
          content="Will be replaced"
          loading={true}
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should replace skeleton with content when loaded', async () => {
      const { rerender } = render(
        <AIInsightCard
          title="Test"
          content="Initial content"
          loading={true}
        />
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      rerender(
        <AIInsightCard
          title="Test"
          content="Final content"
          loading={false}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        expect(screen.getByText('Final content')).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should not crash on error', () => {
      const { container } = render(
        <AIInsightCard
          title="Error Test"
          content="Should not be visible"
          error="API request failed"
        />
      );

      // Should show error banner
      expect(screen.getByText(/AI unavailable/i)).toBeInTheDocument();

      // Should NOT crash or show error details
      expect(screen.queryByText('Should not be visible')).not.toBeInTheDocument();
    });

    it('should show error indicator with amber color', () => {
      const { container } = render(
        <AIInsightCard
          title="Error"
          content="Test"
          error="Connection timeout"
        />
      );

      const errorElement = container.querySelector('[style*="amber"]');
      expect(errorElement).toBeInTheDocument();
    });

    it('should not break page layout on error', () => {
      const { container } = render(
        <div>
          <h1>Dashboard</h1>
          <AIInsightCard
            title="Unsafe Insight"
            content="Test"
            error="Fatal error simulat"
          />
          <p>Other content should still be visible</p>
        </div>
      );

      // Verify page structure is intact
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Other content should still be visible')).toBeInTheDocument();
      expect(screen.getByText(/AI unavailable/i)).toBeInTheDocument();
    });
  });

  describe('Non-Blocking Behavior', () => {
    it('should never throw unhandled errors', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(
          <AIInsightCard
            title="Crash Test"
            content="Test"
            error="Unexpected error"
          />
        );
      }).not.toThrow();

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should render multiple cards without cross-contamination', () => {
      const { container } = render(
        <div>
          <AIInsightCard
            title="Card 1"
            content="Success"
            loading={false}
          />
          <AIInsightCard
            title="Card 2"
            content="Failed"
            error="API error"
          />
          <AIInsightCard
            title="Card 3"
            content="Loading..."
            loading={true}
          />
        </div>
      );

      // Each card should render independently
      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
      expect(screen.getByText('Card 3')).toBeInTheDocument();

      // Card 2 error should not affect card 1 or 3
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Business Role Specific Insights', () => {
    it('should display business_admin insights', () => {
      render(
        <AIInsightCard
          title="CRM Score Alert"
          content="3 clients at risk of churn"
          icon="📊"
        />
      );

      expect(screen.getByText('CRM Score Alert')).toBeInTheDocument();
      expect(screen.getByText('3 clients at risk of churn')).toBeInTheDocument();
    });

    it('should display staff insights', () => {
      render(
        <AIInsightCard
          title="Schedule Recommendation"
          content="You have 2 gaps available for bookings"
          icon="📅"
        />
      );

      expect(screen.getByText('Schedule Recommendation')).toBeInTheDocument();
      expect(screen.getByText('You have 2 gaps available for bookings')).toBeInTheDocument();
    });

    it('should display operations insights', () => {
      render(
        <AIInsightCard
          title="Anomaly Detection"
          content="Unusual spike in cancellations detected"
          icon="⚠️"
        />
      );

      expect(screen.getByText('Anomaly Detection')).toBeInTheDocument();
      expect(screen.getByText('Unusual spike in cancellations detected')).toBeInTheDocument();
    });

    it('should display kora_admin insights', () => {
      render(
        <AIInsightCard
          title="System Action Summary"
          content="5 automated actions executed in last hour"
          icon="🤖"
        />
      );

      expect(screen.getByText('System Action Summary')).toBeInTheDocument();
      expect(screen.getByText('5 automated actions executed in last hour')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <AIInsightCard
          title="Accessible Card"
          content="This card is accessible"
        />
      );

      const card = screen.getByRole('region');
      expect(card).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      const { container } = render(
        <AIInsightCard
          title="Heading Test"
          content="Content"
        />
      );

      const heading = container.querySelector('h4');
      expect(heading).toHaveTextContent('Heading Test');
    });
  });

  describe('Styling & Layout', () => {
    it('should apply teal border on success', () => {
      const { container } = render(
        <AIInsightCard
          title="Success"
          content="All good"
          loading={false}
          error={null}
        />
      );

      const card = container.querySelector('div');
      expect(card).toHaveStyle({ borderColor: '#00e5c8' });
    });

    it('should apply amber styling on error', () => {
      const { container } = render(
        <AIInsightCard
          title="Error"
          content="Test"
          error="Failed"
        />
      );

      const errorIndicator = container.querySelector('[style*="amber"]');
      expect(errorIndicator).toBeInTheDocument();
    });
  });
});
