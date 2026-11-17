import type { SubjectModule } from '@/lib/subject';
import fd from './fd';
import fi from './fi';
import fv from './fv';
import fvcs from './fvcs';
import ifd from './ifd';
import pif from './pif';

/** Subjects with code modules. A subject row in Supabase without a module here shows as "in preparation". */
export const SUBJECTS: Record<string, SubjectModule> = { fvcs, fv, fi, ifd, fd, pif };

export const getSubject = (slug: string): SubjectModule | undefined => SUBJECTS[slug];
