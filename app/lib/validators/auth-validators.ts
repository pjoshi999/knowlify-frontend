/**
 * Authentication Form Validators
 *
 * Provides validation functions for authentication forms:
 * - Email format validation (RFC 5322 compliant)
 * - Password strength validation
 * - Real-time validation feedback
 *
 * Validates: Requirements 1.28, 1.29, 1.30, 1.31
 */

/**
 * Validates email format using RFC 5322 compliant regex
 * @param email - Email address to validate
 * @returns Error message if invalid, undefined if valid
 */
export function validateEmail(email: string): string | undefined {
  if (!email) {
    return "Email is required";
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }

  return undefined;
}

/**
 * Validates password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 *
 * @param password - Password to validate
 * @returns Error message if invalid, undefined if valid
 */
export function validatePassword(password: string): string | undefined {
  if (!password) {
    return "Password is required";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain at least one special character";
  }

  return undefined;
}

/**
 * Calculates password strength score (0-4)
 * Used for password strength indicator
 *
 * @param password - Password to evaluate
 * @returns Strength score from 0 (weakest) to 4 (strongest)
 */
export function getPasswordStrength(password: string): number {
  if (!password) return 0;

  let strength = 0;

  // Length check
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  // Cap at 4
  return Math.min(strength, 4);
}

/**
 * Validates name field
 * @param name - Name to validate
 * @returns Error message if invalid, undefined if valid
 */
export function validateName(name: string): string | undefined {
  if (!name || !name.trim()) {
    return "Name is required";
  }

  if (name.trim().length < 2) {
    return "Name must be at least 2 characters long";
  }

  if (name.trim().length > 100) {
    return "Name must be less than 100 characters";
  }

  return undefined;
}

/**
 * Validates that two passwords match
 * @param password - Original password
 * @param confirmPassword - Confirmation password
 * @returns Error message if they don't match, undefined if they match
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): string | undefined {
  if (password !== confirmPassword) {
    return "Passwords do not match";
  }

  return undefined;
}
