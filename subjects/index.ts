import type { SubjectModule } from '@/lib/subject';
import fv from './fv';
import fvcs from './fvcs';

/** Subjects with code modules. A subject row in Supabase without a module here shows as "in preparation". */
export const SUBJECTS: Record<string, SubjectModule> = { fvcs, fv };

export const getSubject = (slug: string): SubjectModule | undefined => SUBJECTS[slug];
