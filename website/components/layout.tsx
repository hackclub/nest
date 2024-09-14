import Nav from "@/components/nav";
import Footer from "@/components/footer";
import NestMascot from "@/components/nestMascot";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg font-dm-mono text-white">
      <Nav />
      <main className="scrollbar-custom overflow-hidden">{children}</main>
      <Footer />
      <NestMascot hoverImageSrc="/favicon.png" defaultImageSrc="/nest.png" />
    </div>
  );
}
