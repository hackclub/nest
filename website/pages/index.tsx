import Nav from "@/components/nav";
import Hero from "@/components/hero";
import Showcase from "@/components/showcase";
import Info from "@/components/info";

export default function Home() {
  return (
    <main className="min-h-screen bg-bg">
      <Nav />
      <Hero />
      <Showcase />
      <Info />
    </main>
  );
}
