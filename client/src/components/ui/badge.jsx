export function Badge({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border ${className}`}>
      {children}
    </span>
  );
}
