import AboutButton from "../AboutButton";
import FeedbackButton from "../FeedbackButton";

function FloatingActions() {
  return (
    <div className="fixed right-0 top-1/2 z-30 flex -translate-y-1/2 flex-col items-end gap-2">
      <AboutButton />
      <FeedbackButton />
    </div>
  );
}

export default FloatingActions;
