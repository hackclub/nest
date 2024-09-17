import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { DM_Mono } from "next/font/google";
import Layout from "@/components/layout";

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={dmMono.variable}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </div>
  );
}
