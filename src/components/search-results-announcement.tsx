"use client";

import { useEffect, useRef } from "react";

export function SearchResultsAnnouncement({ summary }: { summary: string }) {
  const region = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (region.current) region.current.textContent = summary;
  }, [summary]);

  return <p ref={region} role="status" aria-atomic="true" className="sr-only" />;
}
