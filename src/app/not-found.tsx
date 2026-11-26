import Link from "next/link";

export default function NotFound() {
  return (
    <section className="max-w-xl rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-stone-700">This product or category may no longer be available.</p>
      <Link
        href="/"
        className="mt-5 inline-block rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark"
      >
        Back to catalogue
      </Link>
    </section>
  );
}
