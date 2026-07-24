import { useState } from "react";
import { segmentationHandler } from "@qureai/react-dicom-viewer";

type SegmentStatistics = Awaited<
  ReturnType<typeof segmentationHandler.getSegmentStatistics>
>;

type MetricsPanelProps = {
  segmentationId: string;
  segmentIndex?: number;
  dataRevision: number;
};

type MetricsResult = {
  key: string;
  revision: number;
  statistics: SegmentStatistics;
};

function formatMetric(value: number | undefined, maximumFractionDigits = 2) {
  return value === undefined
    ? "—"
    : new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);
}

function MetricsPanel({
  segmentationId,
  segmentIndex,
  dataRevision,
}: MetricsPanelProps) {
  const [result, setResult] = useState<MetricsResult>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const key =
    segmentIndex === undefined ? "" : `${segmentationId}:${segmentIndex}`;
  const currentResult = result?.key === key ? result : undefined;
  const isStale =
    Boolean(currentResult) && currentResult?.revision !== dataRevision;

  const calculate = async () => {
    if (segmentIndex === undefined) return;
    setIsLoading(true);
    setError("");
    try {
      const statistics = await segmentationHandler.getSegmentStatistics(
        segmentationId,
        segmentIndex,
      );
      setResult({ key, revision: dataRevision, statistics });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsLoading(false);
    }
  };

  const statistics = currentResult?.statistics;

  return (
    <section className="border-b border-[var(--border)] p-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Segment metrics
          </h3>
          {isStale && (
            <p className="mt-0.5 text-[9px] font-semibold text-amber-500">
              Out of date after edits
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void calculate()}
          disabled={segmentIndex === undefined || isLoading}
          className="rounded-md border border-[var(--border)] px-2 py-1 text-[10px] font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Calculating…" : statistics ? "Refresh" : "Calculate"}
        </button>
      </div>

      {error && <p className="mt-2 text-[10px] text-rose-500">{error}</p>}

      {statistics ? (
        <dl
          className={[
            "mt-2 grid grid-cols-2 gap-1.5 transition-opacity",
            isStale ? "opacity-55" : "opacity-100",
          ].join(" ")}
        >
          <div className="rounded-lg bg-[var(--surface-soft)] p-2">
            <dt className="text-[9px] uppercase tracking-wide text-[var(--muted)]">
              Voxels
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-[var(--text)]">
              {formatMetric(statistics.voxelCount, 0)}
            </dd>
          </div>
          <div className="rounded-lg bg-[var(--surface-soft)] p-2">
            <dt className="text-[9px] uppercase tracking-wide text-[var(--muted)]">
              Volume
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-[var(--text)]">
              {formatMetric(statistics.volume)}{" "}
              <span className="text-[9px] font-normal text-[var(--muted)]">
                {statistics.volumeUnit}
              </span>
            </dd>
          </div>
          <div className="rounded-lg bg-[var(--surface-soft)] p-2">
            <dt className="text-[9px] uppercase tracking-wide text-[var(--muted)]">
              Mean
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-[var(--text)]">
              {formatMetric(statistics.mean)}
            </dd>
          </div>
          <div className="rounded-lg bg-[var(--surface-soft)] p-2">
            <dt className="text-[9px] uppercase tracking-wide text-[var(--muted)]">
              Range
            </dt>
            <dd className="mt-0.5 text-xs font-semibold text-[var(--text)]">
              {formatMetric(statistics.min)}–{formatMetric(statistics.max)}
              <span className="ml-1 text-[9px] font-normal text-[var(--muted)]">
                {statistics.intensityUnit}
              </span>
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 rounded-lg border border-dashed border-[var(--border)] px-3 py-3 text-center text-[10px] leading-relaxed text-[var(--muted)]">
          Calculate voxel, volume, and intensity statistics for the active
          segment.
        </p>
      )}
    </section>
  );
}

export default MetricsPanel;
