import { GRADE_SCALE, CREDIT_HOURS, LetterGrade, DEGREE_CLASSIFICATIONS, DIPLOMA_CLASSIFICATIONS } from './gpa-constants';

/**
 * Resolves a raw input (either a letter grade or a 0-100 percentage) to a
 * canonical letter grade. Returns null if the input can't be resolved.
 */
export function resolveGradeInput(input: string): LetterGrade | null {
  const trimmed = input.trim().toUpperCase();

  const directMatch = GRADE_SCALE.find((band) => band.grade === trimmed);
  if (directMatch) return directMatch.grade;

  const asNumber = Number(trimmed);
  if (!Number.isNaN(asNumber) && asNumber >= 0 && asNumber <= 100) {
    const band = GRADE_SCALE.find(
      (b) => asNumber >= b.minPercent && asNumber <= b.maxPercent
    );
    return band ? band.grade : null;
  }

  return null;
}

export function gradeToPoint(grade: LetterGrade): number {
  const band = GRADE_SCALE.find((b) => b.grade === grade);
  return band ? band.gradePoint : 0;
}

export interface CourseEntry {
  grade: LetterGrade | null;
  creditHours?: number; // defaults to CREDIT_HOURS if omitted
}

/**
 * Calculates GPA for a set of courses, matching UPSA's official method:
 * every course in the list contributes its credit hours to the denominator
 * immediately — a course with grade = null (ungraded / no result yet) still
 * counts its hours, it just contributes 0 grade points until a real or
 * hypothetical grade is entered. This mirrors how the official transcript
 * shows TCR including ungraded courses while TGP only reflects what's posted.
 */
export function calculateGPA(courses: CourseEntry[]): number {
  if (courses.length === 0) return 0;

  let totalPoints = 0;
  let totalCreditHours = 0;

  for (const course of courses) {
    const hours = course.creditHours ?? CREDIT_HOURS;
    const points = course.grade ? gradeToPoint(course.grade) * hours : 0;
    totalPoints += points;
    totalCreditHours += hours;
  }

  return totalCreditHours > 0 ? totalPoints / totalCreditHours : 0;
}

export interface SemesterSummary {
  gpa: number;
  totalCreditHours: number;
}

/**
 * Calculates FCGPA across multiple semesters using the year/semester-weighted
 * method: each semester's GPA is weighted by that semester's credit hours,
 * summed, then divided by total cumulative credit hours.
 */
export function calculateCumulativeGPA(semesters: SemesterSummary[]): number {
  const totalCreditHours = semesters.reduce((sum, s) => sum + s.totalCreditHours, 0);
  if (totalCreditHours === 0) return 0;

  const weightedSum = semesters.reduce(
    (sum, s) => sum + s.gpa * s.totalCreditHours,
    0
  );

  return weightedSum / totalCreditHours;
}

export function getClassification(cgpa: number, programType: 'degree' | 'diploma'): string {
  const table = programType === 'degree' ? DEGREE_CLASSIFICATIONS : DIPLOMA_CLASSIFICATIONS;
  const match = table.find((c) => cgpa >= c.min && cgpa <= c.max);
  return match ? match.label : 'Fail';
}
