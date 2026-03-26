#!/usr/bin/env npx ts-node
// scripts/generate-module.ts
// Code generator for scaffolding CRUD pages from modules.json
// Usage: npx ts-node scripts/generate-module.ts

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const modulesPath = path.join(projectRoot, "src/config/modules.json");
const modules = JSON.parse(fs.readFileSync(modulesPath, "utf-8"));

function pascalCase(str: string): string {
  return str
    .split(/[\s\-_]+/)
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Generate LIST PAGE
function generateListPage(key: string, cfg: any): string {
  const columns = cfg.fields
    ?.map(
      (f: any) =>
        `    { accessorKey: "${f.name}", header: "${f.label}" }`
    )
    .join(",\n") || "";

  const componentName = pascalCase(cfg.title);

  return `import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/ui/PageLayout";
import Toolbar from "@/components/ui/Toolbar";
import DataTable from "@/components/ui/DataTable";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { useCrud } from "@/hooks/useCrud";
import type { ${cfg.entity} } from "@/types";

export default function ${componentName}ListPage() {
  const navigate = useNavigate();
  const { data, loading, error, deleteItem } = useCrud<${cfg.entity}>("${cfg.api}");

  const columns = [
${columns},
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <button className="text-xs text-teal-400 hover:underline" onClick={() => navigate(\`${cfg.api}/\${row.original.id}\`)}>
            View
          </button>
          <button className="text-xs text-amber-400 hover:underline" onClick={() => navigate(\`${cfg.api}/\${row.original.id}/edit\`)}>
            Edit
          </button>
          ${!cfg.readonly ? `<button className="text-xs text-red-400 hover:underline" onClick={() => { if (window.confirm("Delete this item?")) deleteItem(row.original.id); }}>Delete</button>` : ""}
        </div>
      ),
    },
  ];

  if (loading) return <Skeleton rows={8} />;
  if (error) return <div className="p-6 text-amber-400 border border-amber-400 rounded">Error: {error}</div>;
  if (!data?.length) return (
    <EmptyState
      message="No ${cfg.entity}s yet"
      action={${!cfg.readonly ? `{ label: "+ New ${cfg.entity}", onClick: () => navigate("${cfg.api}/new") }` : "undefined"}}
    />
  );

  return (
    <PageLayout
      title="${cfg.title}"
      actions={
        ${!cfg.readonly ? `<button className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600" onClick={() => navigate("${cfg.api}/new")}>
          + New ${cfg.entity}
        </button>` : "null"}
      }
    >
      <Toolbar search={<input placeholder="Search ${cfg.title.toLowerCase()}…" className="px-3 py-1 rounded bg-slate-700 text-white text-sm" />} />
      <DataTable columns={columns} data={data || []} onRowClick={(row) => navigate(\`${cfg.api}/\${row.id}\`)} />
    </PageLayout>
  );
}
`;
}

// Generate CREATE PAGE
function generateCreatePage(key: string, cfg: any): string {
  const componentName = pascalCase(cfg.title);
  const fieldInputs = cfg.fields
    ?.filter((f: any) => !f.readonly)
    .map((f: any) => {
      if (f.type === "textarea") {
        return `      <label className="block">
        <span className="text-sm text-gray-300">${f.label}${f.required ? " *" : ""}</span>
        <textarea
          {...register("${f.name}"${f.required ? ", { required: true }" : ""})}
          className="mt-1 block w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
        />
        {errors.${f.name} && <p className="text-xs text-red-400 mt-1">{errors.${f.name}?.message?.toString()}</p>}
      </label>`;
      } else if (f.type === "select") {
        const options = f.options?.map((opt: string) => `<option value="${opt}">${opt}</option>`).join("\n          ") || "";
        return `      <label className="block">
        <span className="text-sm text-gray-300">${f.label}${f.required ? " *" : ""}</span>
        <select
          {...register("${f.name}"${f.required ? ", { required: true }" : ""})}
          className="mt-1 block w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
        >
          <option value="">-- Select --</option>
          ${options}
        </select>
        {errors.${f.name} && <p className="text-xs text-red-400 mt-1">{errors.${f.name}?.message?.toString()}</p>}
      </label>`;
      } else {
        return `      <label className="block">
        <span className="text-sm text-gray-300">${f.label}${f.required ? " *" : ""}</span>
        <input
          {...register("${f.name}"${f.required ? ", { required: true }" : ""})}
          type="${f.type}"
          className="mt-1 block w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
        />
        {errors.${f.name} && <p className="text-xs text-red-400 mt-1">{errors.${f.name}?.message?.toString()}</p>}
      </label>`;
      }
    })
    .join("\n") || "";

  return `import { useNavigate } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import PageLayout from "@/components/ui/PageLayout";
import { useCrud } from "@/hooks/useCrud";
import type { ${cfg.entity} } from "@/types";

export default function Create${componentName}Page() {
  const navigate = useNavigate();
  const { create } = useCrud<${cfg.entity}>("${cfg.api}");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<${cfg.entity}>();

  const onSubmit: SubmitHandler<${cfg.entity}> = async (values) => {
    try {
      await create(values);
      navigate("${cfg.api}");
    } catch (err) {
      console.error("Create error:", err);
    }
  };

  return (
    <PageLayout title="New ${cfg.entity}">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-w-lg bg-slate-800 rounded-lg">
${fieldInputs}
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:opacity-50"
        >
          {isSubmitting ? "Creating…" : "Create ${cfg.entity}"}
        </button>
      </form>
    </PageLayout>
  );
}
`;
}

// Generate EDIT PAGE
function generateEditPage(key: string, cfg: any): string {
  const componentName = pascalCase(cfg.title);
  const fieldInputs = cfg.fields
    ?.filter((f: any) => !f.readonly)
    .map((f: any) => {
      if (f.type === "textarea") {
        return `      <label className="block">
        <span className="text-sm text-gray-300">${f.label}${f.required ? " *" : ""}</span>
        <textarea
          {...register("${f.name}"${f.required ? ", { required: true }" : ""})}
          className="mt-1 block w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
        />
        {errors.${f.name} && <p className="text-xs text-red-400 mt-1">{errors.${f.name}?.message?.toString()}</p>}
      </label>`;
      } else if (f.type === "select") {
        const options = f.options?.map((opt: string) => `<option value="${opt}">${opt}</option>`).join("\n          ") || "";
        return `      <label className="block">
        <span className="text-sm text-gray-300">${f.label}${f.required ? " *" : ""}</span>
        <select
          {...register("${f.name}"${f.required ? ", { required: true }" : ""})}
          className="mt-1 block w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
        >
          <option value="">-- Select --</option>
          ${options}
        </select>
        {errors.${f.name} && <p className="text-xs text-red-400 mt-1">{errors.${f.name}?.message?.toString()}</p>}
      </label>`;
      } else {
        return `      <label className="block">
        <span className="text-sm text-gray-300">${f.label}${f.required ? " *" : ""}</span>
        <input
          {...register("${f.name}"${f.required ? ", { required: true }" : ""})}
          type="${f.type}"
          className="mt-1 block w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
        />
        {errors.${f.name} && <p className="text-xs text-red-400 mt-1">{errors.${f.name}?.message?.toString()}</p>}
      </label>`;
      }
    })
    .join("\n") || "";

  return `import { useNavigate, useParams } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import PageLayout from "@/components/ui/PageLayout";
import { useCrud } from "@/hooks/useCrud";
import type { ${cfg.entity} } from "@/types";

export default function Edit${componentName}Page() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, update } = useCrud<${cfg.entity}>("${cfg.api}");
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<${cfg.entity}>();

  useEffect(() => {
    const item = data?.find(d => d.id === id);
    if (item) reset(item);
  }, [data, id, reset]);

  const onSubmit: SubmitHandler<${cfg.entity}> = async (values) => {
    try {
      if (id) await update(id, values);
      navigate("${cfg.api}");
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  return (
    <PageLayout title="Edit ${cfg.entity}">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-w-lg bg-slate-800 rounded-lg">
${fieldInputs}
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </PageLayout>
  );
}
`;
}

// Main generation logic
console.log("🔧 KÓRA Module Generator – Scaffolding CRUD Pages\n");

Object.entries(modules).forEach(([key, cfg]: [string, any]) => {
  const moduleDir = path.join(projectRoot, "src/pages", key);
  
  if (!fs.existsSync(moduleDir)) {
    fs.mkdirSync(moduleDir, { recursive: true });
    console.log(`📁 Created directory: src/pages/${key}`);
  }

  // Write LIST page
  const listContent = generateListPage(key, cfg);
  fs.writeFileSync(path.join(moduleDir, "ListPage.tsx"), listContent, "utf-8");
  console.log(`✅ Generated: src/pages/${key}/ListPage.tsx`);

  // Write CREATE page (skip for readonly modules)
  if (!cfg.readonly) {
    const createContent = generateCreatePage(key, cfg);
    fs.writeFileSync(path.join(moduleDir, "CreatePage.tsx"), createContent, "utf-8");
    console.log(`✅ Generated: src/pages/${key}/CreatePage.tsx`);

    const editContent = generateEditPage(key, cfg);
    fs.writeFileSync(path.join(moduleDir, "EditPage.tsx"), editContent, "utf-8");
    console.log(`✅ Generated: src/pages/${key}/EditPage.tsx`);
  }
});

console.log("\n✨ All modules scaffolded successfully!");
console.log("📋 Next steps:");
console.log("   1. Wire generated pages to AppShell routes");
console.log("   2. Update navigation.ts with permission checks");
console.log("   3. Run: npm run type-check");
console.log("   4. Run: npm run dev");
