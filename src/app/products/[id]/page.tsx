import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { EnquiryForm } from "@/components/enquiry-form";
import { formatPrice } from "@/components/format-price";
import { ProductImage } from "@/components/product-image";
import { getProduct } from "@/server/catalogue";

type ProductPageProps = { params: Promise<{ id: string }> };
const readProduct = cache(getProduct);

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await readProduct(id);
  return { title: product?.title ?? "Product not found" };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await readProduct(id);
  if (!product) notFound();

  return (
    <>
      <Breadcrumbs
        ancestors={[
          { label: "Catalogue", href: "/" },
          { label: product.category.name, href: `/categories/${product.category.slug}` },
        ]}
        current={product.title}
      />
      <article className="mt-4 grid gap-7 lg:grid-cols-2 lg:items-start lg:gap-12">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-stone-200 bg-white sm:aspect-[4/3] lg:aspect-square">
          <ProductImage
            src={product.imageUrl}
            alt={product.title}
            sizes="(max-width: 1023px) 100vw, (max-width: 1279px) 50vw, 580px"
            eager
          />
        </div>
        <div className="lg:pt-6">
          <h1 className="wrap-anywhere text-3xl font-semibold tracking-tight sm:text-4xl">
            {product.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="text-2xl font-semibold">{formatPrice(product.priceCents)}</p>
            <p className="text-sm text-stone-700">Rated {product.rating} out of 5</p>
          </div>
          <p className="mt-6 max-w-prose wrap-anywhere leading-relaxed text-stone-700">
            {product.description}
          </p>
          <div className="mt-8 border-t border-stone-200 pt-6">
            <EnquiryForm key={product.id} productId={product.id} />
          </div>
        </div>
      </article>
    </>
  );
}
