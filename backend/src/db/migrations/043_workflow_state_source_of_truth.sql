CREATE TABLE IF NOT EXISTS workflow_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    current_state TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_states_entity_unique
    ON workflow_states(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_workflow_states_org_entity
    ON workflow_states(organization_id, entity_type, entity_id);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'workflow_transitions'
    ) THEN
        ALTER TABLE workflow_transitions
            ADD COLUMN IF NOT EXISTS organization_id UUID,
            ADD COLUMN IF NOT EXISTS entity_type TEXT,
            ADD COLUMN IF NOT EXISTS entity_id TEXT,
            ADD COLUMN IF NOT EXISTS reason TEXT,
            ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'workflow_transitions'
              AND column_name = 'workflow_instance_id'
              AND is_nullable = 'NO'
        ) THEN
            ALTER TABLE workflow_transitions
                ALTER COLUMN workflow_instance_id DROP NOT NULL;
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'workflow_transitions'
              AND column_name = 'from_state'
              AND is_nullable = 'NO'
        ) THEN
            ALTER TABLE workflow_transitions
                ALTER COLUMN from_state DROP NOT NULL;
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'workflow_transitions'
              AND column_name = 'triggered_by'
              AND data_type <> 'text'
        ) THEN
            ALTER TABLE workflow_transitions
                ALTER COLUMN triggered_by TYPE TEXT USING triggered_by::text;
        END IF;
    ELSE
        CREATE TABLE workflow_transitions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            from_state TEXT,
            to_state TEXT NOT NULL,
            triggered_by TEXT NOT NULL,
            reason TEXT,
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_workflow_transitions_org_entity
    ON workflow_transitions(organization_id, entity_type, entity_id, created_at DESC);
