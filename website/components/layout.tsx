import Nav from "@/components/nav";
import Footer from "@/components/footer";
import NestMascot from "@/components/nestMascot";
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export default function Layout({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(useInView(ref));
  useEffect(() => {
    setIsInView(!isInView)
  }, [useInView(ref)])

  return (
    <div className="min-h-screen bg-bg font-dm-mono text-white">
      <Nav />
      <main className="scrollbar-custom overflow-hidden">{children}</main>
      <Footer ref = {ref} />
      <NestMascot visible = {isInView} hoverImageSrc="/favicon.png" defaultImageSrc="/nest.png" />
    </div>
  );
}
