export interface ContainerProduct {
  _id?: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  images: string[];
  price: number;
  priceSY?: number;
  stock: number;
  tags: string[];
  aliases: string[];
  notes: string[];
  isActive: boolean;
}

export interface Container {
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
