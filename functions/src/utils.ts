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
