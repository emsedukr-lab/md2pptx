import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@md2pptx/ui";
import "@md2pptx/ui/styles";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MD → PPTX",
  description: "Markdown to PowerPoint converter",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
