import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { DM_Mono } from "next/font/google";
import Head from "next/head";

const dm_mono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${dm_mono.variable}`}>
      <Head>
        <title key="title">Nest</title>
        <link rel="icon" type="image/png" href="/favicon.png" />

        <meta
          key="meta-title"
          name="title"
          content="Nest - a free Linux server from Hack Club"
        />
        <meta
          name="description"
          content="Nest is a free Linux server for high-schoolers to host their projects on, from Hack Club."
        />

        <meta name="apple-mobile-web-app-title" content="Nest" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Nest" />
        <meta
          key="og:title"
          property="og:title"
          content="Nest - a free Linux server from Hack Club"
        />
        <meta property="og:image" content="/nest.svg" />
      </Head>
      <Component {...pageProps} />
    </div>
  );
}
