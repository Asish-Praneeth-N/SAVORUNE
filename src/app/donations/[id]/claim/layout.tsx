import type { ReactNode } from 'react';
import { requirePageRole } from '@/lib/page-auth';

export default async function ClaimLayout({ children }: { children: ReactNode }) {
  await requirePageRole(['RECEIVER']);
  return children;
}
