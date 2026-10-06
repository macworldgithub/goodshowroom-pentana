import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Good Showroom CRM",
  description: "Customer follow-ups and daily dealership work",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
