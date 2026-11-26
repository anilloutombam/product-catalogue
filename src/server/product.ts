export type Category = Readonly<{
  slug: string;
  name: string;
}>;

export type Product = Readonly<{
  id: string;
  title: string;
  description: string;
  category: Category;
  priceCents: number;
  rating: number;
  imageUrl: string;
}>;
