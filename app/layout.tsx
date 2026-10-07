import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Good Showroom · Pentana Operating Layer", template: "%s · Good Showroom" },
  description:
    "Customer relationships, sales follow-ups and dealership coordination in one clear workspace.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
