"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="mt-2 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
