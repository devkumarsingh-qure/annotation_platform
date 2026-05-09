import FeedbackIcon from "../../icons/FeedbackIcon";

function FeedbackButton() {
  return (
    <button
      type="button"
      aria-disabled="true"
      aria-label="Feedback coming soon"
      title="Feedback coming soon"
      onClick={(event) => event.preventDefault()}
      className="inline-flex items-center gap-1.5 rounded-l-full border border-r-0 border-[color-mix(in_srgb,var(--accent-strong)_42%,transparent)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] px-2.5 py-2 text-xs font-semibold text-white shadow-[0_14px_30px_-18px_color-mix(in_srgb,var(--accent-strong)_85%,transparent)] transition hover:brightness-[1.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      <FeedbackIcon className="size-4 shrink-0" />
      <span className="hidden sm:inline">Feedback</span>
    </button>
  );
}

export default FeedbackButton;
