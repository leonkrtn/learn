import type { SubjectModule } from '@/lib/subject';
import fi from './fi';
import fv from './fv';
import fvcs from './fvcs';

/** Subjects with code modules. A subject row in Supabase without a module here shows as "in preparation". */
export const SUBJECTS: Record<string, SubjectModule> = { fvcs, fv, fi };

export const getSubject = (slug: string): SubjectModule | undefined => SUBJECTS[slug];
