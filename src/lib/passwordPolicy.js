export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 20;

export const PASSWORD_POLICY_HINT =
  "Use 12-20 characters with uppercase, lowercase, a number, and a symbol.";

export const PASSWORD_POLICY_NOTICE =
  "Existing passwords still work. Any future password reset or change must use 12-20 characters with uppercase, lowercase, a number, and a symbol.";

function hasUppercase(value) {
  return /[A-Z]/.test(value);
}

function hasLowercase(value) {
  return /[a-z]/.test(value);
}

function hasNumber(value) {
  return /\d/.test(value);
}

function hasSymbol(value) {
  return /[^A-Za-z0-9\s]/.test(value);
}

export function isPasswordPolicyCompliant(password) {
  const normalized = String(password || "");

  return (
    normalized.length >= PASSWORD_MIN_LENGTH &&
    normalized.length <= PASSWORD_MAX_LENGTH &&
    hasUppercase(normalized) &&
    hasLowercase(normalized) &&
    hasNumber(normalized) &&
    hasSymbol(normalized)
  );
}

export function getPasswordPolicyError(password, requiredMessage = "Enter a password.") {
  const normalized = String(password || "");

  if (!normalized) {
    return requiredMessage;
  }

  if (!isPasswordPolicyCompliant(normalized)) {
    return PASSWORD_POLICY_HINT;
  }

  return "";
}
