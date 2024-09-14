import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="UTF-8" />
        <meta
          name="description"
          content="Nest is a free Linux server for high-schoolers to host their projects on, from Hack Club."
        />
        <meta name="keywords" content="hack club,nest,linux,server" />
        <meta name="apple-mobile-web-app-title" content="Nest" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Nest" />
        <meta
          property="og:title"
          content="Nest - a free Linux server from Hack Club"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
