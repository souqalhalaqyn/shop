export const queryKeys = {
  resource: <T extends string>(name: T) => ({
    all: ["api", name] as const,
    list: (params?: Record<string, unknown>) => ["api", name, "list", params] as const,
    detail: (id: string | number) => ["api", name, "detail", id] as const,
  }),

  containers: {
    list: (params?: Record<string, unknown>) => ["api", "containers", "list", params] as const,
  },

  categories: {
    list: (params?: Record<string, unknown>) => ["api", "categories", "list", params] as const,
  },

  orders: {
    all: ["api", "orders"] as const,
    list: (params?: Record<string, unknown>) => ["api", "orders", "list", params] as const,
  },

  bucket: {
    balance: () => ["api", "bucket", "balance"] as const,
  },

  chargeRequests: {
    list: () => ["api", "charge-requests", "list"] as const,
  },

  locations: {
    tree: () => ["api", "locations", "tree"] as const,
  },
};
