import { siteConfig } from "@/config/site.config";

export function AnnouncementBar() {
  if (!siteConfig.announcement) return null;
  return (
    <div className="bg-primary text-on-dark">
      <p className="container-page py-2 text-center text-caption font-medium tracking-wide sm:text-small">{siteConfig.announcement}</p>
    </div>
  );
}
