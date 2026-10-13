const STACK = ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Recharts', 'FastAPI', 'Pydantic', 'SQLAlchemy', 'SQLite', 'OpenCV', 'Pillow', 'Tesseract OCR']

export default function About() {
  return (
    <div className="max-w-3xl space-y-8 text-sm leading-relaxed">
      <div>
        <h1 className="text-2xl font-semibold">About Project</h1>
        <p className="mt-1 text-muted">AI-Powered Explainable Browser Extension for Multi-Modal Scam &amp; Phishing Detection</p>
      </div>
      <section>
        <h2 className="mb-2 text-lg font-medium">Problem</h2>
        <p>Phishing pages look like legitimate services, and most people judge them by appearance. Warnings that do not explain themselves are easy to ignore.</p>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-medium">Proposed solution</h2>
        <p>A platform that analyzes suspicious URLs, QR codes, and screenshots with one shared scoring engine. Every result lists the evidence behind each indicator, how much it contributes, and what to do next.</p>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-medium">System architecture</h2>
        <pre className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-xs">
{`User → React Frontend → FastAPI → URL / QR / Screenshot Analysis → Explainability Engine → SQLite Database
                                                         ↘ optional: Google Safe Browsing, VirusTotal (not yet integrated)`}
        </pre>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-medium">Technology stack</h2>
        <div className="flex flex-wrap gap-2">
          {STACK.map(t => <span key={t} className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs">{t}</span>)}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-medium">Limitations</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted">
          <li>Detection is rule-based. No trained classifier is loaded, and scores are not calibrated probabilities.</li>
          <li>Web pages are not fetched, so page content and certificates are not inspected.</li>
          <li>Visual phishing models are not included; screenshot analysis relies on OCR and wording heuristics.</li>
        </ul>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-medium">Future enhancements</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted">
          <li>Google Safe Browsing and VirusTotal lookups with timeouts and quota handling.</li>
          <li>A trained, evaluated classifier with held-out test data.</li>
          <li>Browser extension integration using the same API.</li>
        </ul>
      </section>
    </div>
  )
}
