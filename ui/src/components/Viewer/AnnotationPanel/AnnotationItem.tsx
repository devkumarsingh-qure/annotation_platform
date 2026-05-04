import { useState } from "react";
import type { AnnotationDetails } from "../../../types/Viewer";
import TrashIcon from "../../../icons/TrashIcon.tsx";
import { viewerProvider } from "@qureai/react-dicom-viewer";
import classNames from "classnames";

function AnnotationItem({
  annotation,
  handleAnnotationDelete,
}: {
  annotation: AnnotationDetails;
  handleAnnotationDelete: (annotationUID: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(true);

  const handleScrollToSlice = () => {
    viewerProvider.scrollViewport.scrollViewportToForActiveViewport(
      annotation.sliceIndex,
    );
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    viewerProvider.annotationHandler.toggleAnnotationVisibilityForActiveViewport(
      {
        annotationUID: annotation.annotationUID,
        isVisible: !isVisible,
      },
    );
    setIsVisible(!isVisible);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleAnnotationDelete(annotation.annotationUID);
  };

  return (
    <div
      key={annotation.annotationUID}
      onClick={handleScrollToSlice}
      className="mx-2 mb-2 flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] p-2 px-3 shadow-sm transition hover:border-[var(--accent)]/45 hover:bg-[var(--accent-soft)] hover:shadow-md"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="text-xs text-[var(--text)]">
          Slice {annotation.sliceIndex + 1}
        </span>
        <span className="text-xs text-[var(--muted)]">•</span>
        <span className="text-xs font-medium text-[var(--muted)]">
          {annotation.toolName}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleToggleVisibility}
          className={classNames("cursor-pointer rounded-md p-2 transition", {
            "text-[var(--accent)] hover:bg-[var(--accent-soft)]": isVisible,
            "text-[var(--muted)] hover:bg-[var(--surface-soft)]": !isVisible,
          })}
          title={isVisible ? "Hide annotation" : "Show annotation"}
        >
          {isVisible ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
              />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="cursor-pointer rounded-md p-2 text-[var(--muted)] transition hover:bg-[color:var(--danger)]/12 hover:text-[color:var(--danger)]"
          title="Delete annotation"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default AnnotationItem;
