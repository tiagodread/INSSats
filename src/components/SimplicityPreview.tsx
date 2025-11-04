import React from "react";

interface SimplicityPreviewProps {
  code: string;
}

export function SimplicityPreview({ code }: SimplicityPreviewProps) {
  const copyToClipboard = () => {
    navigator.clipboard
      ?.writeText(code)
      .catch(() => {
        // clipboard may be unavailable during SSR/testing; ignore failures
      });
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-primary-500/40 bg-slate-950/80 p-6 shadow-lg shadow-primary-900/30">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-primary-100">
            Simplicity output
          </h2>
          <p className="text-xs text-white/50">
            Generated blueprint ready for compilation on the Liquid network.
          </p>
        </div>
        <button
          type="button"
          onClick={copyToClipboard}
          className="rounded-lg border border-primary-400/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-100 transition hover:bg-primary-500/10"
        >
          Copy code
        </button>
      </header>
      <pre className="max-h-[560px] overflow-auto rounded-xl border border-white/10 bg-slate-900/90 p-4 text-xs leading-relaxed text-primary-100">
        <code className="whitespace-pre">{code}</code>
      </pre>
    </section>
  );
}
