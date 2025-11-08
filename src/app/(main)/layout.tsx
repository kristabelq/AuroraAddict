import BottomNav from "@/components/navigation/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-16">
      {children}
      <BottomNav />
    </div>
  );
}
