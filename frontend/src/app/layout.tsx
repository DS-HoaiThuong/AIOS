import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
  title: "AI Personal OS",
  description: "Your personalized AI-driven operating system for tasks, finance, and life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.className} bg-[#F9FAFB] text-zinc-900 min-h-screen selection:bg-indigo-500/30`}>
        {children}
      </body>
    </html>
  );
}
