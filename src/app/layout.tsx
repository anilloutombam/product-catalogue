import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { SearchForm, UrlSearchForm } from "@/components/search-form";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Product catalogue",
    template: "%s | Product catalogue",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink antialiased">
        <a
          href="#main-content"
          className="sr-only z-10 rounded-md bg-white px-4 py-3 font-medium text-accent focus:not-sr-only focus:absolute focus:top-2 focus:left-4"
        >
          Skip to content
        </a>
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-8 lg:px-10">
            <nav aria-label="Main navigation" className="flex items-center gap-4 sm:gap-6">
              <Link
                href="/"
                aria-label="Catalogue home"
                className="rounded-sm py-2 text-xl font-semibold tracking-tight text-accent hover:text-accent-dark"
              >
                Catalogue
              </Link>
              <Link
                href="/#categories"
                className="rounded-sm py-2 text-sm font-medium text-stone-700 hover:text-accent hover:underline"
              >
                Categories
              </Link>
            </nav>
            <Suspense fallback={<SearchForm />}>
              <UrlSearchForm />
            </Suspense>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-8 sm:pt-12 lg:px-10"
        >
          {children}
        </main>
      </body>
    </html>
  );
}
