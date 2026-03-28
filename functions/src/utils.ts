/**
 * Masks an email address for logging purposes.
 * Keeps the first 3 letters and masks the rest before the @ symbol.
 * Example: "example@gmail.com" -> "exa*****@gmail.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  if (local.length <= 3) {
    return local + "*".repeat(5) + "@" + domain;
  }
  return local.substring(0, 3) + "*".repeat(local.length - 3) + "@" + domain;
}

/**
 * Masks a generic sensitive string (PII, names, hints, master keys).
 * Keeps the first 3 letters and masks the rest.
 */
export function maskPII(str: string | null | undefined): string {
  if (!str) return "N/A";
  if (str.length <= 3) return "***";
  return str.substring(0, 3) + "*".repeat(str.length - 3);
}
