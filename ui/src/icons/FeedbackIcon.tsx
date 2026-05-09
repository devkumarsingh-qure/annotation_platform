function FeedbackIcon({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 9.75h6.75m-6.75 3h4.5M21 12c0 4.142-4.03 7.5-9 7.5a10.7 10.7 0 0 1-3.545-.592L3 20.25l1.515-4.038C3.555 15.007 3 13.565 3 12c0-4.142 4.03-7.5 9-7.5s9 3.358 9 7.5Z"
      />
    </svg>
  );
}

export default FeedbackIcon;
