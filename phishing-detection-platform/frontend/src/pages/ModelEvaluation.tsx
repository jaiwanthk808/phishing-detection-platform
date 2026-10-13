export default function ModelEvaluation() {
  const metrics = ['True positives', 'True negatives', 'False positives', 'False negatives', 'Precision', 'Recall', 'F1-score', 'Accuracy']
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Model Evaluation</h1>
        <p className="text-sm text-muted">Phishing is the positive class. Metrics are computed only from labeled ground truth and real model predictions.</p>
      </div>
      <section className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center">
        <p className="font-medium">No evaluation dataset is loaded</p>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
          No trained classifier exists in this build, so no performance metrics are reported. To evaluate a model, add a labeled phishing URL dataset
          (for example, a public dataset with a documented source), split it into training and held-out test sets, train a classifier, and load the
          predictions. Metrics will then appear here.
        </p>
      </section>
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map(m => (
          <div key={m} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <p className="text-xs text-muted">{m}</p>
            <p className="mt-1 text-xl text-muted">—</p>
          </div>
        ))}
      </section>
    </div>
  )
}
