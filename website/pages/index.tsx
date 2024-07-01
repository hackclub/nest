import Nav from "@/components/nav";
import Hero from "@/components/hero";
import Showcase from "@/components/showcase";
import Info from "@/components/info";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-bg overflow-hidden">
      <Nav />
      <Hero />
      <Showcase />
      <Info />
      <Footer />
    </main>
  );
}
