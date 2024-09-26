import Head from "next/head";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import NestMascot from "@/components/nestMascot";
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export default function Layout({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const viewChange = useInView(ref);
  useEffect(() => {
    setIsInView((i) => !i);
  }, [viewChange]);

  return (
    <>
      <Head>
        <title>Nest</title>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <meta
          name="description"
          content="Nest is a free Linux server for high-schoolers to host their projects on, from Hack Club."
        />
        <meta property="og:type" content="website" />
        <meta name="apple-mobile-web-app-title" content="Nest" />
        <meta property="og:site_name" content="Nest" />
        <meta
          property="og:title"
          content="Nest - a free Linux server from Hack Club"
        />
        <meta property="og:image" content="/nest.svg" />
      </Head>
      <div className="min-h-screen bg-bg font-dm-mono text-white">
        <Nav />
        <main className="scrollbar-custom overflow-hidden">{children}</main>
        <Footer ref={ref} />
        <NestMascot
          visible={!isInView}
          hoverImageSrc="/favicon.png"
          defaultImageSrc="/nest.png"
        />
      </div>
    </>
  );
}
