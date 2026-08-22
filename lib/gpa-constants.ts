// UPSA Grading System — Degree & Diploma students
// Credit hours are fixed at 3 for every course

export const CREDIT_HOURS = 3;

export type LetterGrade = 'A' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';

export interface GradeBand {
  grade: LetterGrade;
  minPercent: number;
  maxPercent: number;
  gradePoint: number; // per credit hour
  remark: string;
}

export const GRADE_SCALE: GradeBand[] = [
  { grade: 'A',  minPercent: 80, maxPercent: 100, gradePoint: 4.0, remark: 'Excellent' },
  { grade: 'B+', minPercent: 75, maxPercent: 79,  gradePoint: 3.5, remark: 'Very Good' },
  { grade: 'B',  minPercent: 70, maxPercent: 74,  gradePoint: 3.0, remark: 'Good' },
  { grade: 'B-', minPercent: 65, maxPercent: 69,  gradePoint: 2.5, remark: 'Above Average' },
  { grade: 'C+', minPercent: 60, maxPercent: 64,  gradePoint: 2.0, remark: 'Average' },
  { grade: 'C',  minPercent: 55, maxPercent: 59,  gradePoint: 1.5, remark: 'Below Average' },
  { grade: 'C-', minPercent: 50, maxPercent: 54,  gradePoint: 1.0, remark: 'Marginal Pass' },
  { grade: 'D',  minPercent: 45, maxPercent: 49,  gradePoint: 0.5, remark: 'Unsatisfactory' },
  { grade: 'F',  minPercent: 0,  maxPercent: 44,  gradePoint: 0.0, remark: 'Fail' },
];

export const DEGREE_CLASSIFICATIONS = [
  { label: '1st Class', min: 3.60, max: 4.00 },
  { label: '2nd Class Upper', min: 3.00, max: 3.59 },
  { label: '2nd Class Lower', min: 2.50, max: 2.99 },
  { label: '3rd Class', min: 2.00, max: 2.49 },
  { label: 'Pass', min: 1.00, max: 1.99 },
  { label: 'Fail', min: 0, max: 0.99 },
];

export const DIPLOMA_CLASSIFICATIONS = [
  { label: 'Distinction', min: 3.50, max: 4.00 },
  { label: 'Credit', min: 2.50, max: 3.49 },
  { label: 'Pass', min: 1.00, max: 2.49 },
  { label: 'Fail', min: 0, max: 0.99 },
];
