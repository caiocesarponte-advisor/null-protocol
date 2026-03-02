import type { ReactNode } from "react";

export const metadata = {
  title: "null-protocol",
  description: "Phase 1 monorepo foundations"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
