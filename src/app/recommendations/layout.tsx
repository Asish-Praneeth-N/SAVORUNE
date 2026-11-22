import type { ReactNode } from 'react';
import { requirePageRole } from '@/lib/page-auth';
export default async function RecommendationsLayout({ children }: { children: ReactNode }) {
  await requirePageRole(['RECEIVER', 'ADMIN']);
  return children;
}
