import { useState } from "react";
import { GoCpu } from "react-icons/go";
import { BsMemory, BsNvme, BsHddNetwork } from "react-icons/bs";
export default function Info() {
  const [component, setComponent] = useState<
    "Linux" | "Services" | "Community" | null
  >(null);

  let text;
  switch (component) {
    case "Linux":
      text = (
        <p>
          Every computer that you use has an operating system. An operating
          system manages your computer&apos;s resources and makes sure that
          everything running on your computer, from the internal system tools to
          the web browser you&apos;re using to read this, has time to run.
          <br />
          <br />
          Popular operating systems include Windows, MacOS, and Linux! Linux
          isn&apos;t used as much as Windows and MacOS for personal computers,
          but it&apos;s still popular among developers and enthusiasts. However,
          Linux is the standard for servers! That&apos;s why we use Linux for
          Nest. It&apos;s a little different from what you might be used to, but
          you&apos;ll be working with Linux in no time!
          <br />
          <br />
          <a
            href="https://guides.hackclub.app/index.php/Linux"
            className="italic underline"
          >
            Learn more about Linux on Nest Guides
          </a>
        </p>
      );
      break;
    case "Services":
      text = (
        <p>
          Nest provides a collection of services to help you host your projects!
          These include{" "}
          <a
            href="https://guides.hackclub.app/index.php/PostgreSQL"
            className="underline"
          >
            Nest Postgres
          </a>{" "}
          (easy to use Postgres database),{" "}
          <a href="https://identity.hackclub.app">Nest Identity</a> for
          authentication, and{" "}
          <a
            href="https://guides.hackclub.app/index.php/Caddy"
            className="underline"
          >
            Caddy
          </a>{" "}
          for a webserver.
        </p>
      );
      break;
    case "Community":
      text = (
        <p>
          As part of Hack Club, Nest has a community of over 200 users and
          others in the{" "}
          <a href="https://hackclub.com/slack" className="underline">
            Hack Club Slack
          </a>{" "}
          who are happy to help you with any issues you might encounter. The{" "}
          <a
            href="https://hackclub.slack.com/archives/C056WDR3MQR"
            className="underline"
          >
            #nest
          </a>{" "}
          channel on Slack is the best place to ask any questions related to
          Nest, and you can also ask in other channels like{" "}
          <a href="https://hackclub.slack.com/archives/C0EA9S0A0">#code</a> if
          you have a question related to your project.
          <br />
          <br />
          Nest also has a team of 5 active admins who are able to assist you
          with any requests you might have. You can ping them on Slack with the
          @nestadmins user group.
        </p>
      );
      break;
    default:
      text = <p>Click on an element of Nest to read more!</p>;
      break;
  }

  return (
    <section className="flex flex-col items-center justify-start gap-y-3 p-4 px-4 py-10 font-dm-mono text-white lg:p-16 lg:py-0 2xl:p-32">
      <p className="text-center text-3xl font-medium 2xl:text-4xl">
        What makes <span className="text-HCPurpleText">Nest</span> a nest?
      </p>
      <p className="max-w-4xl lg:text-center lg:text-lg 2xl:text-xl">
        Nest is a{" "}
        <a
          href="https://www.hetzner.com/dedicated-rootserver/ex44/"
          className="text-HCPurpleText underline"
        >
          Hetzner EX44
        </a>{" "}
        dedicated server, located in Helsinki, Finland. Users share a{" "}
        <span className="italic">virtual machine</span> on the server.
      </p>
      <div className="flex flex-col gap-y-4 self-start lg:hidden">
        <div className="rounded-lg p-4">
          <div className="flex items-center">
            <GoCpu className="text-4xl text-HCPurpleText" />
            <div className="ml-4">
              <div className="text-lg font-medium">Processor</div>
              <div className="text-sm text-gray-300">i5-13500</div>
            </div>
          </div>
        </div>
        <div className="rounded-lg p-4">
          <div className="flex items-center">
            <BsMemory className="text-4xl text-HCPurpleText" />
            <div className="ml-4">
              <div className="text-lg font-medium">Memory</div>
              <div className="text-sm text-gray-300">64 GB DDR4 Ram</div>
            </div>
          </div>
        </div>
        <div className="rounded-lg p-4">
          <div className="flex items-center">
            <BsNvme className="text-4xl text-HCPurpleText" />
            <div className="ml-4">
              <div className="text-lg font-medium">Disk Space</div>
              <div className="text-sm text-gray-300">2 x 512 GB NVMe SSDs + 1 x 1 TB NVMe SSD</div>
            </div>
          </div>
        </div>
        <div className="rounded-lg p-4">
          <div className="flex items-center">
            <BsHddNetwork className="text-4xl text-HCPurpleText" />
            <div className="ml-4">
              <div className="text-lg font-medium">Internet</div>
              <div className="text-sm text-gray-300">Gigabit uncapped</div>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden w-full grid-cols-7 px-20 py-10 lg:grid">
        <pre className="col-span-3 w-min text-sm">{`
		                       .,,uod8B8bou,,.
              ..,uod8BBBBBBBBBBBBBBBBRPFT?l!i:.
         ,=m8BBBBBBBBBBBBBBBRPFT?!||||||||||||||
         !...:!TVBBBRPFT||||||||||!!^^""'   ||||
         !.......:!?|||||!!^^""'            ||||
         !.........||||                     ||||
         !.........||||  orpheus@nest:~$    ||||
         !.........||||                     ||||
         !.........||||    check slack      ||||
         \`.........||||                    ,||||
          .;.......||||               _.-!!|||||
   .,uodWBBBBb.....||||       _.-!!|||||||||!:'
!YBBBBBBBBBBBBBBb..!|||:..-!!|||||||!iof68BBBBBb....
!..YBBBBBBBBBBBBBBb!!||||||||!iof68BBBBBBRPFT?!::   \`.
!....YBBBBBBBBBBBBBBbaaitf68BBBBBBRPFT?!:::::::::     \`.
!......YBBBBBBBBBBBBBBBBBBBRPFT?!::::::;:!^"\`;:::       \`.
!........YBBBBBBBBBBRPFT?!::::::::::^''...::::::;         iBBbo.
\`..........YBRPFT?!::::::::::::::::::::::::;iof68bo.      WBBBBbo.
  \`..........:::::::::::::::::::::::;iof688888888888b.     \`YBBBP^'
    \`........::::::::::::::::;iof688888888888888888888b.     \`
      \`......:::::::::;iof688888888888888888888888888888b.
        \`....:::;iof6888888888888888888888888888888899fT!
          \`..::!8888888888888888888888888888899fT|!^"'
            \`' !!988888888888888888888899fT|!^"'
                \`!!8888888888888888899fT|!^"'
                  \`!988888888899fT|!^"'
                    \`!9899fT|!^"'
                      \`!^"'
		`}</pre>
        <div className="col-span-1 flex w-min flex-col items-center justify-start gap-y-10 pt-20 text-xl">
          <button
            className={component === "Linux" ? "font-medium" : "opacity-75"}
            onClick={() => setComponent("Linux")}
          >
            Linux
          </button>
          <button
            className={component === "Services" ? "font-medium" : "opacity-75"}
            onClick={() => setComponent("Services")}
          >
            Services
          </button>
          <button
            className={component === "Community" ? "font-medium" : "opacity-75"}
            onClick={() => setComponent("Community")}
          >
            Community
          </button>
        </div>
        <div className="col-span-3 h-min rounded-lg bg-gray-900 p-5">
          {text}
        </div>
      </div>
    </section>
  );
}
