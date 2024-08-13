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
        <title>Nest</title>
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Head>
      <Component {...pageProps} />
    </div>
  );
}
