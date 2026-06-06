import type { ContainerProduct } from "./product";

export interface CategoryContainer {
  _id: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  brand: { _id: string; name: string };
  categories: (string | { _id: string; name: string })[];
  products: ContainerProduct[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  containers: CategoryContainer[];
  createdAt: string;
  updatedAt: string;
}
