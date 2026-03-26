# Dynamic Workflow Engine Architecture

## The Problem

**Current State**:
- Backend: 95% complete (150+ endpoints)
- Frontend: 30% complete (missing CRUD UIs)
- Team B must manually build 40+ forms

**Estimated Effort**: 6-8 weeks of repetitive CRUD coding

---

## The Solution: Schema-Driven UI Generation

**Concept**: Automatically generate CRUD UIs from database schema + metadata.

**Result**: Reduce 80% of manual form coding.

---

## Architecture Overview

```
Database Schema
↓
Schema Introspection
↓
UI Metadata (JSON)
↓
Dynamic Form Generator
↓
Rendered CRUD UI
```

---

## Implementation

### 1. Schema Introspection Service

```typescript
// backend/src/services/schema/introspector.ts
interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  relationships: RelationshipSchema[];
  permissions: PermissionSchema;
}

interface ColumnSchema {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "enum" | "json";
  required: boolean;
  unique: boolean;
  default?: any;
  validation?: ValidationRule[];
  ui?: UIHints;
}

interface UIHints {
  widget: "input" | "textarea" | "select" | "date" | "file" | "rich-text";
  label: string;
  placeholder?: string;
  helpText?: string;
  hidden?: boolean;
  readonly?: boolean;
}

export async function introspectTable(tableName: string): Promise<TableSchema> {
  const columns = await queryDb(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = $1
  `, [tableName]);
  
  return {
    name: tableName,
    columns: columns.map(col => ({
      name: col.column_name,
      type: mapPostgresType(col.data_type),
      required: col.is_nullable === 'NO',
      default: col.column_default,
      ui: inferUIHints(col)
    })),
    relationships: await introspectRelationships(tableName),
    permissions: await getPermissions(tableName)
  };
}
```

### 2. UI Metadata API

```typescript
// backend/src/modules/schema/routes.ts
export const schemaRoutes = Router();

schemaRoutes.get("/tables/:tableName/schema", async (req, res) => {
  const { tableName } = req.params;
  const schema = await introspectTable(tableName);
  res.json(schema);
});

schemaRoutes.get("/tables/:tableName/ui-config", async (req, res) => {
  const { tableName } = req.params;
  const config = await getUIConfig(tableName);
  res.json(config);
});
```

### 3. Dynamic Form Generator (Frontend)

```tsx
// frontend/src/components/dynamic/DynamicForm.tsx
interface DynamicFormProps {
  entity: string; // "clients", "bookings", "services"
  mode: "create" | "edit";
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void>;
}

export function DynamicForm({ entity, mode, initialData, onSubmit }: DynamicFormProps) {
  const [schema, setSchema] = useState<TableSchema | null>(null);
  const [formData, setFormData] = useState(initialData || {});
  
  useEffect(() => {
    fetch(`/api/schema/tables/${entity}/schema`)
      .then(res => res.json())
      .then(setSchema);
  }, [entity]);
  
  if (!schema) return <div>Loading...</div>;
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
      {schema.columns.map(column => (
        <DynamicField
          key={column.name}
          column={column}
          value={formData[column.name]}
          onChange={(value) => setFormData({ ...formData, [column.name]: value })}
        />
      ))}
      <button type="submit">{mode === "create" ? "Create" : "Update"}</button>
    </form>
  );
}
```

### 4. Dynamic Field Renderer

```tsx
// frontend/src/components/dynamic/DynamicField.tsx
interface DynamicFieldProps {
  column: ColumnSchema;
  value: any;
  onChange: (value: any) => void;
}

export function DynamicField({ column, value, onChange }: DynamicFieldProps) {
  const { ui, type, required } = column;
  
  switch (ui?.widget || inferWidget(type)) {
    case "input":
      return (
        <div>
          <label>{ui?.label || column.name}</label>
          <input
            type={type === "number" ? "number" : "text"}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            placeholder={ui?.placeholder}
            style={{
              padding: 10,
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              background: "var(--color-surface)",
              color: "var(--color-text-primary)"
            }}
          />
          {ui?.helpText && <small>{ui.helpText}</small>}
        </div>
      );
    
    case "textarea":
      return (
        <div>
          <label>{ui?.label || column.name}</label>
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            rows={4}
            style={{
              padding: 10,
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              background: "var(--color-surface)",
              color: "var(--color-text-primary)"
            }}
          />
        </div>
      );
    
    case "select":
      return (
        <div>
          <label>{ui?.label || column.name}</label>
          <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            style={{
              padding: 10,
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              background: "var(--color-surface)",
              color: "var(--color-text-primary)"
            }}
          >
            <option value="">Select...</option>
            {/* Options from enum or relationship */}
          </select>
        </div>
      );
    
    case "date":
      return (
        <div>
          <label>{ui?.label || column.name}</label>
          <input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            style={{
              padding: 10,
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              background: "var(--color-surface)",
              color: "var(--color-text-primary)"
            }}
          />
        </div>
      );
    
    default:
      return null;
  }
}
```

### 5. UI Configuration (JSON)

```json
// backend/src/config/ui/clients.json
{
  "entity": "clients",
  "label": "Clients",
  "icon": "👤",
  "columns": [
    {
      "name": "first_name",
      "ui": {
        "widget": "input",
        "label": "First Name",
        "placeholder": "John",
        "helpText": "Client's legal first name"
      }
    },
    {
      "name": "email",
      "ui": {
        "widget": "input",
        "label": "Email Address",
        "placeholder": "john@example.com"
      },
      "validation": [
        { "type": "email", "message": "Invalid email format" }
      ]
    },
    {
      "name": "membership_tier",
      "ui": {
        "widget": "select",
        "label": "Membership Tier",
        "options": [
          { "value": "standard", "label": "Standard" },
          { "value": "premium", "label": "Premium" },
          { "value": "vip", "label": "VIP" }
        ]
      }
    }
  ],
  "list": {
    "columns": ["first_name", "last_name", "email", "membership_tier"],
    "searchable": ["first_name", "last_name", "email"],
    "sortable": ["created_at", "last_name"],
    "filters": ["membership_tier"]
  },
  "actions": {
    "create": true,
    "edit": true,
    "delete": true,
    "custom": [
      {
        "name": "send_message",
        "label": "Send Message",
        "icon": "💬",
        "endpoint": "/api/clients/:id/message"
      }
    ]
  }
}
```

### 6. Dynamic CRUD Pages

```tsx
// frontend/src/pages/dynamic/DynamicCRUDPage.tsx
interface DynamicCRUDPageProps {
  entity: string;
}

export function DynamicCRUDPage({ entity }: DynamicCRUDPageProps) {
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  return (
    <div style={{ padding: 24 }}>
      {view === "list" && (
        <DynamicList
          entity={entity}
          onCreate={() => setView("create")}
          onEdit={(id) => { setSelectedId(id); setView("edit"); }}
        />
      )}
      
      {view === "create" && (
        <DynamicForm
          entity={entity}
          mode="create"
          onSubmit={async (data) => {
            await fetch(`/api/${entity}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data)
            });
            setView("list");
          }}
        />
      )}
      
      {view === "edit" && selectedId && (
        <DynamicForm
          entity={entity}
          mode="edit"
          initialData={await fetchEntity(entity, selectedId)}
          onSubmit={async (data) => {
            await fetch(`/api/${entity}/${selectedId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data)
            });
            setView("list");
          }}
        />
      )}
    </div>
  );
}
```

---

## Benefits

### 1. Reduce Development Time
- **Before**: 6-8 weeks to build 40+ forms
- **After**: 1-2 weeks to build engine + configs

### 2. Consistency
- All forms use same UI components
- Automatic theme compliance
- Standardized validation

### 3. Maintainability
- Schema changes auto-reflect in UI
- Single source of truth
- No duplicate form code

### 4. Flexibility
- Override UI hints per field
- Custom widgets for special cases
- Workflow-specific forms

### 5. Scalability
- Add new entities without coding
- Support 100+ entities easily
- Multi-tenant by default

---

## Implementation Phases

### Phase 1: Core Engine (Week 1)
- Schema introspection service
- UI metadata API
- DynamicForm component
- DynamicField component

### Phase 2: UI Configs (Week 2)
- Create configs for 10 core entities
- Test CRUD workflows
- Refine UI hints

### Phase 3: Advanced Features (Week 3)
- Relationship handling (foreign keys)
- File uploads
- Rich text editors
- Custom validators

### Phase 4: Workflow Integration (Week 4)
- Workflow-specific forms
- Multi-step wizards
- Conditional fields
- Action buttons

---

## Example: Client CRUD (Auto-Generated)

### List Page
```tsx
<DynamicCRUDPage entity="clients" />
```

**Generates**:
- Table with columns: first_name, last_name, email, membership_tier
- Search bar (searches first_name, last_name, email)
- Filter dropdown (membership_tier)
- Create button
- Edit/Delete actions per row

### Create Page
```tsx
<DynamicForm entity="clients" mode="create" />
```

**Generates**:
- First Name input
- Last Name input
- Email input (with email validation)
- Phone input
- Address input
- City, State, ZIP inputs
- Membership Tier select
- Create/Cancel buttons

### Edit Page
```tsx
<DynamicForm entity="clients" mode="edit" initialData={client} />
```

**Generates**: Same form, pre-filled with client data

---

## Comparison

### Manual Approach (Current)
```
40 entities × 3 pages (list, create, edit) = 120 pages
120 pages × 200 lines = 24,000 lines of code
Estimated time: 6-8 weeks
```

### Dynamic Approach (Proposed)
```
1 engine + 40 configs = 40 JSON files
Engine: ~2,000 lines
Configs: 40 × 50 lines = 2,000 lines
Total: 4,000 lines
Estimated time: 2-3 weeks
```

**Savings**: 20,000 lines of code, 4-5 weeks of development

---

## Advanced Features

### 1. Workflow-Specific Forms
```json
{
  "workflow": "booking_checkin",
  "fields": ["booking_id", "arrival_time", "notes"],
  "actions": ["checkin", "cancel"]
}
```

### 2. Conditional Fields
```json
{
  "name": "insurance_number",
  "visible_when": {
    "field": "has_insurance",
    "equals": true
  }
}
```

### 3. Custom Validators
```json
{
  "name": "phone",
  "validation": [
    { "type": "regex", "pattern": "^\\+?[1-9]\\d{1,14}$", "message": "Invalid phone" }
  ]
}
```

### 4. Multi-Step Wizards
```json
{
  "steps": [
    { "title": "Personal Info", "fields": ["first_name", "last_name", "email"] },
    { "title": "Address", "fields": ["address", "city", "state", "zip"] },
    { "title": "Preferences", "fields": ["membership_tier", "notifications"] }
  ]
}
```

---

## Migration Strategy

### Week 1: Build Engine
- Schema introspection
- Dynamic form generator
- Test with 1 entity (clients)

### Week 2: Migrate 10 Entities
- Create UI configs
- Replace manual forms
- Test workflows

### Week 3: Migrate Remaining 30 Entities
- Batch create configs
- Comprehensive testing
- Performance optimization

### Week 4: Advanced Features
- Workflow forms
- Custom widgets
- Polish UX

---

## ROI Analysis

### Investment
- 3-4 weeks development
- ~4,000 lines of code

### Return
- 20,000 lines of code saved
- 4-5 weeks saved
- Infinite scalability (add entities without coding)
- Automatic schema sync
- Consistent UX

**ROI**: 5x development efficiency

---

## Recommendation

**Implement Dynamic Workflow Engine immediately.**

This will:
1. Unblock Team B (no more manual form coding)
2. Accelerate frontend completion (30% → 95% in 3 weeks)
3. Future-proof architecture (add entities without coding)
4. Match enterprise SaaS platforms (Salesforce, Odoo use similar systems)

**Next Step**: Approve architecture, start Phase 1.
