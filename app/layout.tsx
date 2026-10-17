import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import Script from "next/script";
import { CartDrawer } from "@/components/features/cart/CartDrawer";
import { CartHydrator } from "@/components/features/cart/CartHydrator";
import { AnnouncementBar } from "@/components/features/layout/AnnouncementBar";
import { FloatingChat } from "@/components/features/layout/FloatingChat";
import { Footer } from "@/components/features/layout/Footer";
import { Header } from "@/components/features/layout/Header";
import { HideOnAdmin } from "@/components/features/layout/HideOnAdmin";
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

// Mọi trang đọc database (menu dịp tặng ở header) nên render theo từng request thay vì lúc build:
// lúc build trên Railway chưa có volume chứa database, và admin sửa sản phẩm là khách thấy ngay.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#F5EBDD",
  width: "device-width",
  initialScale: 1,
};

// Một số extension trình duyệt (IDM, Bitdefender, Grammarly…) tự gắn thuộc tính vào DOM
// trước khi React hydrate, gây lỗi "hydration mismatch" giả ở chế độ dev.
// Script này gỡ các thuộc tính đó cho tới khi trang hydrate xong rồi tự dừng.
const EXTENSION_ATTRS = ["fdprocessedid", "bis_skin_checked", "bis_register", "data-new-gr-c-s-check-loaded", "data-gr-ext-installed"];
const stripExtensionAttrs = `(function(){
  var attrs=${JSON.stringify(EXTENSION_ATTRS)},budget=5000;
  var obs=new MutationObserver(function(ms){
    for(var i=0;i<ms.length;i++){var t=ms[i].target;
      if(t.nodeType===1&&t.hasAttribute(ms[i].attributeName)){t.removeAttribute(ms[i].attributeName);budget--;}}
    if(budget<=0)obs.disconnect();
  });
  obs.observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:attrs});
  function stop(){setTimeout(function(){obs.disconnect();},3000);}
  if(document.readyState==="complete")stop();else window.addEventListener("load",stop);
})();`;

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
        <HideOnAdmin>
          <AnnouncementBar />
          <Header occasions={occasions} />
        </HideOnAdmin>
        <main id="noi-dung-chinh" className="flex-1" tabIndex={-1}>
          {children}
        </main>
        <HideOnAdmin>
          <Footer />
          <CartDrawer />
          <FloatingChat />
        </HideOnAdmin>
        <Toaster />
        <CartHydrator />
        {process.env.NODE_ENV === "development" && (
          <Script id="strip-extension-attrs" strategy="beforeInteractive">
            {stripExtensionAttrs}
          </Script>
        )}
      </body>
    </html>
  );
}
