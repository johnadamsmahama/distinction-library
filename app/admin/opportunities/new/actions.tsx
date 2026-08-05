'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const VALID_CATEGORIES = [
  'scholarship',
  'internship',
  'graduate_programme',
  'job',
  'competition',
  'conference',
  'workshop',
  'volunteer',
] as const;

export async function createOpportunity(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Admin gate — server-side, cannot be bypassed from the client
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new Error('Not authorized. Admin access required.');
  }

  const title = (formData.get('title') as string)?.trim();
  const organization = (formData.get('organization') as string)?.trim();
  const category = formData.get('category') as string;
  const description = (formData.get('description') as string)?.trim() || null;
  const eligibility = (formData.get('eligibility') as string)?.trim() || null;
  const deadlineRaw = formData.get('deadline') as string;
  const deadline = deadlineRaw ? deadlineRaw : null;
  const location = (formData.get('location') as string)?.trim() || null;
  const remoteOrOnsite = (formData.get('remote_or_onsite') as string)?.trim() || null;
  const benefits = (formData.get('benefits') as string)?.trim() || null;
  const requiredDocuments = (formData.get('required_documents') as string)?.trim() || null;
  const applicationProcess = (formData.get('application_process') as string)?.trim() || null;
  const applicationLink = (formData.get('application_link') as string)?.trim() || null;
  const contactInfo = (formData.get('contact_info') as string)?.trim() || null;
  const verified = formData.get('verified') === 'on';
  const featured = formData.get('featured') === 'on';

  // Required-field validation
  if (!title) throw new Error('Title is required.');
  if (!organization) throw new Error('Organization is required.');
  if (!category || !VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
    throw new Error('A valid category is required.');
  }

  const { error } = await supabase.from('opportunities').insert({
    title,
    organization,
    category,
    description,
    eligibility,
    deadline,
    location,
    remote_or_onsite: remoteOrOnsite,
    benefits,
    required_documents: requiredDocuments,
    application_process: applicationProcess,
    application_link: applicationLink,
    contact_info: contactInfo,
    verified,
    featured,
    source: 'admin_curated',
    status: 'published',
    published_at: new Date().toISOString(),
    approved_by: user.id,
    submitted_by: user.id,
  });

  if (error) {
    throw new Error(`Failed to create opportunity: ${error.message}`);
  }

  revalidatePath('/opportunity-hub');
  redirect('/opportunity-hub');
}
