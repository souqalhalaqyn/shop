export const queryKeys = {
  all: ["api"] as const,

  // -- Auth --
  auth: {
    all: ["api", "auth"] as const,
    me: () => ["api", "auth", "me"] as const,
    profile: () => ["api", "auth", "profile"] as const,
    locations: () => ["api", "auth", "locations"] as const,
  },

  // -- Generic CRUD factory --
  resource: <T extends string>(name: T) => ({
    all: ["api", name] as const,
    list: (params?: Record<string, unknown>) => ["api", name, "list", params] as const,
    detail: (id: string | number) => ["api", name, "detail", id] as const,
  }),

  // -- Convenience prefixes for common domains --
  products: {
    all: ["api", "products"] as const,
    list: (params?: Record<string, unknown>) => ["api", "products", "list", params] as const,
    detail: (id: string | number) => ["api", "products", "detail", id] as const,
  },

  containers: {
    all: ["api", "containers"] as const,
    list: (params?: Record<string, unknown>) => ["api", "containers", "list", params] as const,
    detail: (id: string | number) => ["api", "containers", "detail", id] as const,
  },

  categories: {
    all: ["api", "categories"] as const,
    list: (params?: Record<string, unknown>) => ["api", "categories", "list", params] as const,
    detail: (id: string | number) => ["api", "categories", "detail", id] as const,
  },

  orders: {
    all: ["api", "orders"] as const,
    list: (params?: Record<string, unknown>) => ["api", "orders", "list", params] as const,
    detail: (id: string | number) => ["api", "orders", "detail", id] as const,
  },

  bucket: {
    all: ["api", "bucket"] as const,
    balance: () => ["api", "bucket", "balance"] as const,
  },

  chargeRequests: {
    all: () => ["api", "charge-requests"] as const,
    list: () => ["api", "charge-requests", "list"] as const,
  },

  locations: {
    all: ["api", "locations"] as const,
    tree: () => ["api", "locations", "tree"] as const,
    states: () => ["api", "locations", "states"] as const,
    regions: (stateId: string) => ["api", "locations", "regions", stateId] as const,
    ways: (regionId: string) => ["api", "locations", "ways", regionId] as const,
  },
};
