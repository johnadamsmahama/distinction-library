import { GRADE_SCALE, CREDIT_HOURS, LetterGrade, DEGREE_CLASSIFICATIONS, DIPLOMA_CLASSIFICATIONS } from './gpa-constants';

/**
 * Resolves a raw input (either a letter grade or a 0-100 percentage) to a
 * canonical letter grade. Returns null if the input can't be resolved.
 */
export function resolveGradeInput(input: string): LetterGrade | null {
  const trimmed = input.trim().toUpperCase();

  // Direct letter match
  const directMatch = GRADE_SCALE.find((band) => band.grade === trimmed);
  if (directMatch) return directMatch.grade;

  // Percentage match
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
 * Calculates GPA for a set of courses. Courses with a null grade
 * (i.e. genuinely un-filled, neither released nor hypothetical) are
 * excluded from both numerator and denominator, so a partially-completed
 * semester doesn't get diluted by phantom zeros.
 */
export function calculateGPA(courses: CourseEntry[]): number {
  const gradedCourses = courses.filter((c) => c.grade !== null);
  if (gradedCourses.length === 0) return 0;

  let totalPoints = 0;
  let totalCreditHours = 0;

  for (const course of gradedCourses) {
    const hours = course.creditHours ?? CREDIT_HOURS;
    totalPoints += gradeToPoint(course.grade as LetterGrade) * hours;
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
