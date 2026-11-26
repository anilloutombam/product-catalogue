import Link from "next/link";

type Breadcrumb = { label: string; href: string };

export function Breadcrumbs({
  ancestors,
  current,
}: {
  ancestors: Breadcrumb[];
  current: string;
}) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-stone-700">
        {ancestors.map(({ label, href }) => (
          <li key={href} className="flex items-baseline gap-2">
            <Link
              href={href}
              className="rounded-sm font-medium text-accent underline underline-offset-4 hover:text-accent-dark"
            >
              {label}
            </Link>
            <span aria-hidden="true" className="text-stone-500">/</span>
          </li>
        ))}
        <li aria-current="page" className="min-w-0 max-w-full wrap-anywhere">
          {current}
        </li>
      </ol>
    </nav>
  );
}
