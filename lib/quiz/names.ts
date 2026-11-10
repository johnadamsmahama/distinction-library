// Client-safe helpers for student names on quizzes.
// Names are always stored and shown in CAPITAL LETTERS.

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toUpperCase();
}

// "DELPHINA AGBEMAFLE" -> "Delphina". Used in friendly messages so students are not shouted at.
export function friendlyFirstName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? '';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}
