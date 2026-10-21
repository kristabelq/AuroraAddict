import BottomNav from "@/components/navigation/BottomNav";
import AboutFab from "@/components/navigation/AboutFab";
import SiteFooter from "@/components/SiteFooter";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-16">
      {children}
      <SiteFooter />
      <AboutFab />
      <BottomNav />
    </div>
  );
}
