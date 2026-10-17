// lib/trusted-upload/types.ts

export type UploadType = 'past_paper' | 'study_material';

export type TrustedUploadConfig = {
  // One-course batches: the course every file in the zip belongs to.
  // Many-course batches (multiCourse = true): these are empty strings and
  // each file's course is read from the zip folder it sits in, e.g.
  // "BASC102/some paper.pdf" belongs to course BASC102.
  courseId: string;
  courseCode: string;
  uploadType: UploadType;
  multiCourse?: boolean;
};

export type JobResultStatus =
  | 'approved'
  | 'skipped_duplicate'
  | 'skipped_manual'
  | 'needs_metadata'
  | 'needs_course_review'
  | 'error';

export type JobResult = {
  filename: string;
  status: JobResultStatus;
  note: string;
  extractedCode?: string; // present only for needs_course_review
};
