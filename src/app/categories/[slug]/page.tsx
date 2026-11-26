import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductGrid } from "@/components/product-grid";
import { getCategoryCatalogue } from "@/server/catalogue";

type CategoryPageProps = { params: Promise<{ slug: string }> };
const readCategory = cache(getCategoryCatalogue);

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const catalogue = await readCategory(slug);
  return { title: catalogue?.category.name ?? "Category not found" };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const catalogue = await readCategory(slug);
  if (!catalogue) notFound();

  const { category, topRated, additional } = catalogue;

  return (
    <>
      <Breadcrumbs ancestors={[{ label: "Catalogue", href: "/" }]} current={category.name} />
      <h1 className="mt-3 text-4xl font-semibold tracking-tight first-letter:uppercase sm:text-5xl">
        {category.name}
      </h1>
      <section aria-labelledby="top-rated" className="mt-8">
        <h2 id="top-rated" className="mb-4 text-xl font-semibold tracking-tight sm:text-2xl">
          Top-rated products
        </h2>
        <ProductGrid products={topRated} headingLevel={3} />
      </section>
      <section aria-labelledby="additional-products" className="mt-10 border-t border-stone-200 pt-8">
        <h2 id="additional-products" className="mb-4 text-xl font-semibold tracking-tight sm:text-2xl">
          Additional products
        </h2>
        {additional.length > 0 ? (
          <ProductGrid products={additional} headingLevel={3} />
        ) : (
          <p className="rounded-xl border border-stone-200 bg-white p-6 text-stone-700">
            There are no additional products in this category.
          </p>
        )}
      </section>
    </>
  );
}
