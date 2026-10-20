type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading..." }: LoadingStateProps) {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}
