-- Migration 044: Blog / Content module
-- Owner: Database Team
-- Locked: content articles, moderation workflow, publish/retract lifecycle

CREATE TABLE IF NOT EXISTS content_articles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  author_id         UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL,
  category          TEXT,
  excerpt           TEXT,
  body              TEXT,
  status            TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','pending_review','approved','published','retracted')),
  tags              TEXT[] NOT NULL DEFAULT '{}',
  published_at      TIMESTAMPTZ,
  retracted_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_content_articles_org_status
  ON content_articles (organization_id, status);

CREATE TABLE IF NOT EXISTS content_article_audit (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id  UUID NOT NULL REFERENCES content_articles(id) ON DELETE CASCADE,
  actor_id    UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,  -- 'submitted','approved','published','retracted','edited'
  from_status TEXT,
  to_status   TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
