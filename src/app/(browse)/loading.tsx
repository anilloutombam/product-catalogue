export default function Loading() {
  return (
    <div role="status">
      <p className="font-medium text-stone-700">Loading products…</p>
      <div
        aria-hidden="true"
        className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-5"
      >
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="aspect-square rounded-2xl border border-stone-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
