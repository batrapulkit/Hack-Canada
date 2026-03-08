/**
 * Utility: createPageUrl
 * Ensures consistent internal routing throughout the Triponic B2B dashboard.
 * Converts a page name (like "Dashboard") to a valid route ("/dashboard").
 */
export function createPageUrl(name) {
  if (!name) return "/";
  // Normalize casing and remove spaces
  return `/${name}`
    .replace(/\s+/g, "")
    .replace(/[()]/g, "")
    .replace(/([A-Z])/g, (match) => match.toLowerCase());
}

/**
 * Utility: formatCurrency
 * Converts a numeric value into a human-readable currency string.
 */
export function formatCurrency(value, currency = "USD") {
  if (isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Utility: formatDate
 * Converts a date into Triponic’s friendly format (e.g., Mar 11, 2025).
 */
export function formatDate(date) {
  try {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}
