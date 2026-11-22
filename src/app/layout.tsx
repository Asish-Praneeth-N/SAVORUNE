import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { NavShell } from "@/components/nav-shell";
import { NexenInspector } from '@/components/_internal/NexenInspector';
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SAVORUNE | Smart Food Rescue & Surplus Redistribution",
    template: "%s | SAVORUNE",
  },
  description: "SAVORUNE connects food donors, NGOs and volunteers through intelligent surplus food matching, coordinated pickups and measurable social impact.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'SAVORUNE | Smart Food Rescue',
    description: 'Every portion deserves a purpose.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'SAVORUNE | Smart Food Rescue', description: 'Every portion deserves a purpose.' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const shell = <NavShell>{children}</NavShell>;

  return (
    <html lang="en">
      <body>
        <NexenInspector />
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          afterSignOutUrl="/"
          appearance={{ variables: { colorPrimary: '#1f6b4d', colorBackground: '#ffffff', borderRadius: '1rem' } }}
        >{shell}</ClerkProvider>
      </body>
    </html>
  );
}
