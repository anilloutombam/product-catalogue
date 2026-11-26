"use client";

import Form from "next/form";
import { useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

export function SearchForm({ initialQuery = "" }: { initialQuery?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [invalid, setInvalid] = useState(false);

  function showValidationError() {
    setInvalid(true);
    inputRef.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const input = inputRef.current;
    const query = input?.value.trim();
    if (!input || !query) {
      event.preventDefault();
      showValidationError();
      return;
    }

    input.value = query;
    setInvalid(false);
  }

  return (
    <Form
      role="search"
      action="/search"
      onSubmit={handleSubmit}
      className="w-full min-w-0 sm:ml-auto sm:w-auto"
    >
      <div className="flex gap-2">
        <label htmlFor="catalogue-search" className="sr-only">
          Search products
        </label>
        <input
          ref={inputRef}
          id="catalogue-search"
          type="search"
          name="q"
          defaultValue={initialQuery}
          required
          pattern=".*\S.*"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? "catalogue-search-error" : undefined}
          onChange={() => setInvalid(false)}
          onInvalid={(event) => {
            event.preventDefault();
            showValidationError();
          }}
          placeholder="Search products"
          className="min-w-0 flex-1 rounded-lg border border-stone-400 bg-white px-3 py-2 placeholder:text-stone-500 aria-invalid:border-red-700 sm:w-56 sm:text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
        >
          Search
        </button>
      </div>
      {invalid && (
        <p id="catalogue-search-error" role="alert" className="mt-1 text-sm text-red-700">
          Enter a search term.
        </p>
      )}
    </Form>
  );
}

export function UrlSearchForm() {
  const query = useSearchParams().get("q") ?? "";

  return <SearchForm key={query} initialQuery={query.trim()} />;
}
