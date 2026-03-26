import type { OpenAPIV3 } from "openapi-types";

export function generateOpenAPISpec(): OpenAPIV3.Document {
  return {
    openapi: "3.0.3",
    info: {
      title: "KORA Platform API",
      version: "1.2.0",
      description: "AI-powered business platform API with modular architecture",
      contact: {
        name: "KORA Platform Team",
        email: "api@kora.platform"
      },
      license: {
        name: "Proprietary",
        url: "https://kora.platform/license"
      }
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Development server"
      },
      {
        url: "https://api.kora.platform",
        description: "Production server"
      }
    ],
    security: [
      {
        bearerAuth: []
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
            details: { type: "object" }
          },
          required: ["error", "message"]
        },
        Client: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string" },
            organization_id: { type: "string", format: "uuid" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" }
          },
          required: ["id", "name", "email", "organization_id"]
        },
        Booking: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            client_id: { type: "string", format: "uuid" },
            service_id: { type: "string", format: "uuid" },
            staff_member_id: { type: "string", format: "uuid" },
            start_time: { type: "string", format: "date-time" },
            end_time: { type: "string", format: "date-time" },
            status: { 
              type: "string", 
              enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"] 
            },
            organization_id: { type: "string", format: "uuid" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" }
          },
          required: ["id", "client_id", "service_id", "start_time", "end_time", "status"]
        },
        Service: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string" },
            duration_minutes: { type: "integer", minimum: 1 },
            price_cents: { type: "integer", minimum: 0 },
            category_id: { type: "string", format: "uuid" },
            organization_id: { type: "string", format: "uuid" },
            is_active: { type: "boolean" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" }
          },
          required: ["id", "name", "duration_minutes", "price_cents", "organization_id"]
        },
        Staff: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string" },
            organization_id: { type: "string", format: "uuid" },
            is_active: { type: "boolean" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" }
          },
          required: ["id", "name", "email", "role", "organization_id"]
        }
      },
      parameters: {
        organizationId: {
          name: "X-Organization-Id",
          in: "header",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Organization ID for multi-tenant access"
        },
        pageParam: {
          name: "page",
          in: "query",
          schema: { type: "integer", minimum: 1, default: 1 },
          description: "Page number for pagination"
        },
        limitParam: {
          name: "limit",
          in: "query",
          schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          description: "Number of items per page"
        }
      }
    },
    paths: {
      "/auth/status": {
        get: {
          tags: ["Authentication"],
          summary: "Check authentication status",
          security: [],
          responses: {
            "200": {
              description: "Authentication status",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      authenticated: { type: "boolean" },
                      timestamp: { type: "string", format: "date-time" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "/auth/me": {
        get: {
          tags: ["Authentication"],
          summary: "Get current user info",
          responses: {
            "200": {
              description: "Current user information",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      userId: { type: "string" },
                      organizationId: { type: "string" },
                      userRole: { type: "string" },
                      sessionId: { type: "string" }
                    }
                  }
                }
              }
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" }
                }
              }
            }
          }
        }
      },
      "/clients": {
        get: {
          tags: ["Clients"],
          summary: "List clients",
          parameters: [
            { $ref: "#/components/parameters/organizationId" },
            { $ref: "#/components/parameters/pageParam" },
            { $ref: "#/components/parameters/limitParam" }
          ],
          responses: {
            "200": {
              description: "List of clients",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      clients: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Client" }
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          page: { type: "integer" },
                          limit: { type: "integer" },
                          total: { type: "integer" },
                          totalPages: { type: "integer" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ["Clients"],
          summary: "Create new client",
          parameters: [
            { $ref: "#/components/parameters/organizationId" }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    phone: { type: "string" }
                  },
                  required: ["name", "email"]
                }
              }
            }
          },
          responses: {
            "201": {
              description: "Client created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Client" }
                }
              }
            },
            "400": {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" }
                }
              }
            }
          }
        }
      },
      "/clients/{id}": {
        get: {
          tags: ["Clients"],
          summary: "Get client by ID",
          parameters: [
            { $ref: "#/components/parameters/organizationId" },
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" }
            }
          ],
          responses: {
            "200": {
              description: "Client details",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Client" }
                }
              }
            },
            "404": {
              description: "Client not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" }
                }
              }
            }
          }
        },
        put: {
          tags: ["Clients"],
          summary: "Update client",
          parameters: [
            { $ref: "#/components/parameters/organizationId" },
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" }
            }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    phone: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Client updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Client" }
                }
              }
            },
            "404": {
              description: "Client not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" }
                }
              }
            }
          }
        },
        delete: {
          tags: ["Clients"],
          summary: "Delete client",
          parameters: [
            { $ref: "#/components/parameters/organizationId" },
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" }
            }
          ],
          responses: {
            "204": {
              description: "Client deleted"
            },
            "404": {
              description: "Client not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" }
                }
              }
            }
          }
        }
      },
      "/bookings": {
        get: {
          tags: ["Bookings"],
          summary: "List bookings",
          parameters: [
            { $ref: "#/components/parameters/organizationId" },
            { $ref: "#/components/parameters/pageParam" },
            { $ref: "#/components/parameters/limitParam" },
            {
              name: "status",
              in: "query",
              schema: { 
                type: "string", 
                enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"] 
              }
            },
            {
              name: "start_date",
              in: "query",
              schema: { type: "string", format: "date" }
            },
            {
              name: "end_date",
              in: "query",
              schema: { type: "string", format: "date" }
            }
          ],
          responses: {
            "200": {
              description: "List of bookings",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      bookings: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Booking" }
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          page: { type: "integer" },
                          limit: { type: "integer" },
                          total: { type: "integer" },
                          totalPages: { type: "integer" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ["Bookings"],
          summary: "Create new booking",
          parameters: [
            { $ref: "#/components/parameters/organizationId" }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    client_id: { type: "string", format: "uuid" },
                    service_id: { type: "string", format: "uuid" },
                    staff_member_id: { type: "string", format: "uuid" },
                    start_time: { type: "string", format: "date-time" },
                    end_time: { type: "string", format: "date-time" }
                  },
                  required: ["client_id", "service_id", "start_time", "end_time"]
                }
              }
            }
          },
          responses: {
            "201": {
              description: "Booking created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Booking" }
                }
              }
            }
          }
        }
      },
      "/ai/orchestrate/live": {
        post: {
          tags: ["AI Orchestration"],
          summary: "Live AI orchestration",
          parameters: [
            { $ref: "#/components/parameters/organizationId" }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    context: { type: "object" },
                    autoExecute: { type: "boolean", default: false }
                  }
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Orchestration results",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      actions: { type: "array", items: { type: "object" } },
                      executed: { type: "array", items: { type: "object" } },
                      timestamp: { type: "string", format: "date-time" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      { name: "Authentication", description: "Authentication and authorization" },
      { name: "Clients", description: "Client management" },
      { name: "Bookings", description: "Booking management" },
      { name: "Services", description: "Service management" },
      { name: "Staff", description: "Staff management" },
      { name: "AI Orchestration", description: "AI-powered workflow orchestration" },
      { name: "Notifications", description: "Notification system" },
      { name: "Reporting", description: "Analytics and reporting" }
    ]
  };
}