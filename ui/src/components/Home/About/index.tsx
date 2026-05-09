import PageOverviewHeader from "../PageOverviewHeader";

const developerEmail = "kumar.kumardev12345@gmail.com";

function About() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-3 sm:p-6">
      <PageOverviewHeader
        eyebrow="About us"
        title="Annotation Platform"
        description="A workspace for organizing medical imaging datasets, managing annotation projects, assigning reviewers, and reviewing DICOM studies with annotation and metadata tools."
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 sm:gap-6">
          <section className="rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] p-4 shadow-sm sm:rounded-xl sm:p-6">
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-[var(--text)] sm:text-base">
                Annotation Platform is designed to help imaging teams move from
                uploaded DICOM files to structured patient records, project
                worklists, reviewer assignments, and exportable annotation sets.
              </p>
              <p className="text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                The application is currently under development. Features,
                workflows, and interface details may continue to change as the
                product is improved.
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-strong)_88%,transparent)] p-4 shadow-sm sm:rounded-xl sm:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)] sm:text-xs">
              About developer
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-[8rem_1fr] sm:items-baseline">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Name
              </span>
              <span className="text-sm font-semibold text-[var(--text)] sm:text-base">
                Dev Kumar Singh
              </span>

              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Email
              </span>
              <a
                href={`mailto:${developerEmail}`}
                className="min-w-0 break-words text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline sm:text-base"
              >
                {developerEmail}
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default About;
