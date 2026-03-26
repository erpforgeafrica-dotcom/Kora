import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestApp } from "./testAppFactory.js";

const { queryDbMock, transitionStateMock } = vi.hoisted(() => ({
  queryDbMock: vi.fn(),
  transitionStateMock: vi.fn(),
}));

vi.mock("../db/client.js", () => ({
  queryDb: queryDbMock,
}));

vi.mock("../workflows/WorkflowEngine.js", () => ({
  WorkflowEngine: class {
    transitionState = transitionStateMock;
  },
}));

describe("Booking workflow routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transitionStateMock.mockResolvedValue({ success: true });
  });

  it("checks a confirmed booking into checked_in instead of in_progress", async () => {
    queryDbMock
      .mockResolvedValueOnce([{ id: "booking-1", status: "confirmed" }])
      .mockResolvedValueOnce([]);

    const app = await createTestApp({ role: "staff" });
    const res = await request(app)
      .post("/api/bookings/workflow/booking-1/checkin")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1")
      .send({ qr_code: "qr-123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("checked_in");
    expect(transitionStateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        entityType: "booking",
        entityId: "booking-1",
        toState: "checked_in",
      })
    );
  });

  it("forbids starting a booking before check-in", async () => {
    queryDbMock.mockResolvedValueOnce([{ id: "booking-1", status: "confirmed" }]);

    const app = await createTestApp({ role: "staff" });
    const res = await request(app)
      .post("/api/bookings/workflow/booking-1/start")
      .set("Authorization", "Bearer test")
      .set("x-org-id", "org-1");

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_TRANSITION");
  });
});
