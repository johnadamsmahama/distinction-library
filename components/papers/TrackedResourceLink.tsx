'use client';

import { createClient } from '@/lib/supabase/client';

export default function TrackedResourceLink({
  href,
  resourceType,
  resourceId,
  courseId,
  courseCode,
  title,
  className,
  children,
}: {
  href: string;
  resourceType: 'paper' | 'material';
  resourceId: string;
  courseId: string | null;
  courseCode: string | null;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  const logView = () => {
    // Fire-and-forget — never block or fail the actual file open over this.
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('resource_views')
        .insert({
          user_id: user.id,
          resource_type: resourceType,
          resource_id: resourceId,
          course_id: courseId,
          course_code: courseCode,
          title,
        })
        .then(() => {});
    });
  };

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={logView} className={className}>
      {children}
    </a>
  );
}
