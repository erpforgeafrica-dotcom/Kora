import { Router } from "express";
import { introspectTable } from "../../services/schema/introspector.js";
import { loadEntityConfig } from "../../config/entities/loader.js";
import { respondSuccess } from "../../shared/response.js";

export const schemaRoutes = Router();

schemaRoutes.get("/tables/:tableName", async (req, res, next) => {
  try {
    const { tableName } = req.params;
    const schema = await introspectTable(tableName);
    const config = await loadEntityConfig(tableName);
    
    respondSuccess(res, { ...schema, ...config });
  } catch (err) {
    next(err);
  }
});

schemaRoutes.get("/entities", async (req, res, next) => {
  try {
    const entities = [
      { name: "clients", label: "Clients", icon: "👤" },
      { name: "bookings", label: "Bookings", icon: "📅" },
      { name: "services", label: "Services", icon: "🛠️" },
      { name: "staff", label: "Staff", icon: "👨‍💼" },
      { name: "service_categories", label: "Categories", icon: "📁" }
    ];
    respondSuccess(res, { entities });
  } catch (err) {
    next(err);
  }
});
