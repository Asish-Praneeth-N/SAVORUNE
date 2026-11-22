import type { ReactNode } from 'react';
import { requirePageRole } from '@/lib/page-auth';
export default async function NewDonationLayout({ children }: { children: ReactNode }) {
  await requirePageRole(['DONOR']);
  return children;
}
