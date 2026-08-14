// lib/trusted-upload/types.ts

export type UploadType = 'past_paper' | 'study_material';

export type TrustedUploadConfig = {
  courseId: string;
  courseCode: string;
  uploadType: UploadType;
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
