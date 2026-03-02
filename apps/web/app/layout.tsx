import type { ReactNode } from "react";

export const metadata = {
  title: "null-protocol",
  description: "Phase 4 runtime + loader + persistence demo"
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
