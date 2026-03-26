import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestApp } from "./testAppFactory.js";

const { queryDbMock } = vi.hoisted(() => ({
  queryDbMock: vi.fn(),
}));

vi.mock("../db/client.js", () => ({
  queryDb: queryDbMock,
}));

describe("Content routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists published articles publicly with canonical pagination metadata", async () => {
    queryDbMock
      .mockResolvedValueOnce([{ total: 2 }])
      .mockResolvedValueOnce([
        {
          id: "article-1",
          organization_id: "org-1",
          organization_name: "Kora Care",
          title: "Spring Wellness Tips",
          slug: "spring-wellness-tips",
          category: "Wellness",
          excerpt: "How to stay healthy this season",
          tags: ["wellness", "tips"],
          published_at: "2026-03-25T10:00:00Z",
          created_at: "2026-03-24T10:00:00Z",
          author_name: "Dr Ada",
        },
        {
          id: "article-2",
          organization_id: "org-2",
          organization_name: "Kora Labs",
          title: "Lab Safety Basics",
          slug: "lab-safety-basics",
          category: "Lab",
          excerpt: "Core public safety guidance",
          tags: ["lab"],
          published_at: "2026-03-24T10:00:00Z",
          created_at: "2026-03-23T10:00:00Z",
          author_name: "Bola",
        },
      ]);

    const app = await createTestApp();
    const res = await request(app).get("/api/content/public/articles?limit=10&page=1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({
      page: 1,
      limit: 10,
      total: 2,
      total_pages: 1,
    });
    expect(res.body.data[0]).toMatchObject({
      id: "article-1",
      organization_name: "Kora Care",
      slug: "spring-wellness-tips",
    });
  });

  it("returns a published article publicly by id", async () => {
    queryDbMock.mockResolvedValueOnce([
      {
        id: "article-1",
        organization_id: "org-1",
        organization_name: "Kora Care",
        title: "Spring Wellness Tips",
        slug: "spring-wellness-tips",
        category: "Wellness",
        excerpt: "How to stay healthy this season",
        body: "Full article body",
        tags: ["wellness", "tips"],
        published_at: "2026-03-25T10:00:00Z",
        created_at: "2026-03-24T10:00:00Z",
        author_name: "Dr Ada",
      },
    ]);

    const app = await createTestApp();
    const res = await request(app).get("/api/content/public/articles/article-1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: "article-1",
      title: "Spring Wellness Tips",
      organization_name: "Kora Care",
    });
  });

  it("returns 404 when a published article is not found", async () => {
    queryDbMock.mockResolvedValueOnce([]);

    const app = await createTestApp();
    const res = await request(app).get("/api/content/public/articles/missing");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("ARTICLE_NOT_FOUND");
  });
});
