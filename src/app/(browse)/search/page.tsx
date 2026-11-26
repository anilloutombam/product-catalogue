import type { Metadata } from "next";

import { ProductGrid } from "@/components/product-grid";
import { SearchResultsAnnouncement } from "@/components/search-results-announcement";
import { searchProducts } from "@/server/catalogue";

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

async function submittedQuery(searchParams: SearchPageProps["searchParams"]) {
  const { q } = await searchParams;
  return (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const query = await submittedQuery(searchParams);
  return { title: query ? `Search results for “${query}”` : "Search" };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = await submittedQuery(searchParams);
  const products = await searchProducts(query);
  const count = products.length === 1 ? "1 product" : `${products.length} products`;
  const summary = query ? `${count} matching “${query}”` : "";

  return (
    <>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Search results</h1>
      {!query && <p className="mt-4 text-stone-700">Enter a search term to find products.</p>}
      <SearchResultsAnnouncement summary={summary} />
      {summary && <p className="mt-4 wrap-anywhere text-stone-700">{summary}</p>}
      {query && products.length === 0 && (
        <p className="mt-6 rounded-xl border border-stone-200 bg-white p-6 text-stone-700">
          Try a different product name or keyword.
        </p>
      )}
      {products.length > 0 && (
        <div className="mt-7">
          <ProductGrid products={products} headingLevel={2} />
        </div>
      )}
    </>
  );
}
