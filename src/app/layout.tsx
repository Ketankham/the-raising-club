import type { Metadata } from "next";
import { DM_Sans, Playfair_Display, Albert_Sans } from "next/font/google";
import "./globals.css";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const albertSans = Albert_Sans({
  variable: "--font-albert-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Raising Club — More than childcare",
  description:
    "Trusted care for families, real careers for caregivers, and reliable staffing and training for the programs that serve them—all inside one club.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfair.variable} ${albertSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        {children}
        <FeedbackWidget />
      </body>
    </html>
  );
}
