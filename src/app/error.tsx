"use client";

export default function ErrorPage() {
  return (
    <section className="max-w-xl rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
      <div role="alert">
        <h1 className="text-2xl font-semibold tracking-tight">The catalogue is unavailable</h1>
        <p className="mt-2 text-stone-700">We couldn’t load the products. Please try again.</p>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-5 rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark"
      >
        Try again
      </button>
    </section>
  );
}
