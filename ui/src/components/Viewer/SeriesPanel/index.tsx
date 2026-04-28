import type { Study, Series } from "../../../types/Patient";

function SeriesPanel({
  studies,
  series,
  onClickSeries,
}: {
  studies: Study[];
  series: Series;
  onClickSeries: ({
    study_id,
    series_id,
  }: {
    study_id: string;
    series_id: string;
  }) => void;
}) {
  const shortValue = (value: string, maxLength = 36) => {
    if (!value) {
      return "-";
    }
    if (value.length <= maxLength) {
      return value;
    }
    return `${value.slice(0, maxLength)}...`;
  };

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-[10px]">
      <div className="shrink-0 border-b border-[var(--border)] px-3 py-4">
        <div className="mt-1 flex items-end justify-between gap-2">
          <h1 className="text-sm font-semibold text-[var(--text)]">
            Studies
          </h1>
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--muted)]">
            {studies.length} studies
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-2 py-3">
        {studies.length === 0 ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-xs text-[var(--muted)]">
            No studies available.
          </div>
        ) : (
          studies.map((study) => (
            <section
              key={study.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-strong)]/70"
            >
              <div className="border-b border-[var(--border)]/70 px-2.5 py-2">
                <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                  Accession Number
                </p>
                <p
                  className="text-xs font-medium text-[var(--text)] truncate"
                  title={study.AccessionNumber}
                >
                  {shortValue(study.AccessionNumber, 32)}
                </p>
              </div>

              <div className="space-y-1 p-2">
                {study.series.length === 0 ? (
                  <p className="rounded-md bg-[var(--surface-soft)] px-2 py-1.5 text-[11px] text-[var(--muted)]">
                    No series in this study
                  </p>
                ) : (
                  study.series.map((studySeries) => (
                    <button
                      key={studySeries.id}
                      type="button"
                      onClick={() =>
                        onClickSeries({
                          study_id: study.id,
                          series_id: studySeries.id,
                        })
                      }
                      className={`w-full rounded-md border px-2 py-1.5 text-left transition ${
                        series?.id === studySeries.id
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]/60"
                          : "border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--accent)]/60 hover:bg-[var(--accent-soft)]/40"
                      }`}
                    >
                      <p className="text-xs font-semibold text-[var(--text)]">
                        {studySeries.Modality || "N/A"} | Series{" "}
                        {studySeries.SeriesNumber || "-"}
                      </p>
                      <p
                        className="mt-0.5 text-[11px] text-[var(--muted)]"
                        title={studySeries.SeriesDescription}
                      >
                        {studySeries.SeriesDescription || "-"}
                      </p>
                      <p
                        className="mt-0.5 text-[11px] text-[var(--muted)] truncate"
                        title={studySeries.SeriesNumber}
                      >
                        Series Number: {shortValue(studySeries.SeriesNumber)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </section>
          ))
        )}
      </div>
    </aside>
  );
}

export default SeriesPanel;
