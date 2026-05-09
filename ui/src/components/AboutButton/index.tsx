import { useNavigate } from "react-router-dom";
import InfoIcon from "../../icons/InfoIcon";
import { UI_PATHS } from "../../utils/urls";

function AboutButton() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      aria-label="Open About us"
      title="About us"
      onClick={() => navigate(UI_PATHS.ABOUT())}
      className="inline-flex items-center gap-1.5 rounded-l-full border border-r-0 border-[color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color-mix(in_srgb,var(--surface-strong)_94%,transparent)] px-2.5 py-2 text-xs font-semibold text-[var(--text)] shadow-[0_14px_30px_-20px_color-mix(in_srgb,var(--text)_45%,transparent)] backdrop-blur-[12px] transition hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] hover:bg-[var(--surface-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      <InfoIcon className="size-4 shrink-0 text-[var(--accent)]" />
      <span className="hidden sm:inline">About us</span>
    </button>
  );
}

export default AboutButton;
