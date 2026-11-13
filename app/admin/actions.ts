'use server';

import { revalidatePath } from 'next/cache';
import { getAdmin } from '@/lib/supabase/server';

/** Rebuilds the public page right after an administrator saves a change. */
export async function revalidateSite(): Promise<void> {
  if (!(await getAdmin())) throw new Error('Not an administrator');
  revalidatePath('/');
}
