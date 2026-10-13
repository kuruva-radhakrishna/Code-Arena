// 0 = too short ... 4 = strong. Only a UX hint; the server enforces the real minimum.
export function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

export const STRENGTH_LABEL = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];
