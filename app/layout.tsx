import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import { CartDrawer } from "@/components/features/cart/CartDrawer";
import { CartHydrator } from "@/components/features/cart/CartHydrator";
import { AnnouncementBar } from "@/components/features/layout/AnnouncementBar";
import { FloatingChat } from "@/components/features/layout/FloatingChat";
import { Footer } from "@/components/features/layout/Footer";
import { Header } from "@/components/features/layout/Header";
import { Toaster } from "@/components/ui/Toaster";
import { siteConfig } from "@/config/site.config";
import { listOccasions } from "@/services/product.service";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "900"],
  display: "swap",
});

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} – ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: ["hộp quà", "quà tặng", "gift box", "quà 20/10", "quà 20/11", "quà sinh nhật", "quà Valentine", "quà tốt nghiệp"],
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: `${siteConfig.name} – ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#F5EBDD",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const occasions = await listOccasions();
  return (
    <html lang="vi" className={`${playfair.variable} ${beVietnam.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#noi-dung-chinh"
          className="sr-only z-[90] rounded-full bg-primary px-4 py-2 font-semibold text-on-dark focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Bỏ qua đến nội dung chính
        </a>
        <AnnouncementBar />
        <Header occasions={occasions} />
        <main id="noi-dung-chinh" className="flex-1" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <CartDrawer />
        <FloatingChat />
        <Toaster />
        <CartHydrator />
      </body>
    </html>
  );
}
