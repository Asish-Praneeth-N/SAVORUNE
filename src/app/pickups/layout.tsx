import type { ReactNode } from 'react';
import { requirePageRole } from '@/lib/page-auth';
export default async function PickupsLayout({ children }: { children: ReactNode }) {
  await requirePageRole(['DONOR', 'RECEIVER', 'VOLUNTEER', 'ADMIN']);
  return children;
}
