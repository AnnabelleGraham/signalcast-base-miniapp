import type { Metadata } from "next";
import { MobileShell } from "@/components/mobile-shell";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SignalCast",
  description: "Onchain signal publishing and trend participation on Base.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <meta name="base:app_id" content="69c653752f29a15e2b91ed2c" />
        <meta
          name="talentapp:project_verification"
          content="c85017caeff0cac48cbd6c4b485e11c96d6f7da921d654036cbd7d1b2dc6f940d943c0a51d81f7e2705613c2a175aa5f6ea946604a52479fe8528b396adfef16"
        />
      </head>
      <body className="min-h-full">
        <Providers>
          <MobileShell>{children}</MobileShell>
        </Providers>
      </body>
    </html>
  );
}
