import { readFileSync, existsSync } from "fs";
import { join } from "path";

export interface EntityConfig {
  list?: {
    columns: string[];
    searchable?: string[];
    sortable?: string[];
  };
  actions?: {
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
  };
}

export async function loadEntityConfig(entityName: string): Promise<EntityConfig> {
  const configPath = join(process.cwd(), "src", "config", "entities", `${entityName}.json`);
  
  if (!existsSync(configPath)) {
    return {
      list: { columns: [] },
      actions: { create: true, edit: true, delete: true }
    };
  }

  const content = readFileSync(configPath, "utf-8");
  return JSON.parse(content);
}
