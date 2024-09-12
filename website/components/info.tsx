import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoCpu } from "react-icons/go";
import { BsMemory, BsNvme, BsHddNetwork } from "react-icons/bs";

export default function Info() {
  const [component, setComponent] = useState<"Specs" | "Linux" | "Services" | "Community" | null>(null);

  const getTextContent = (tab: "Specs" | "Linux" | "Services" | "Community") => {
    switch (tab) {
      case "Specs":
        return "Nest is a Hetzner EX44 dedicated server, located in Helsinki, Finland. Users share a virtual machine on the server.\n\nThe server specs include:\n- Processor: i5-13500\n- Memory: 64 GB DDR4\n- Storage: 2TB NVMe\n- Network: 1 Gbps\n\nThis powerful configuration allows for smooth operation of various projects and services.";
      case "Linux":
        return (
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
      case "Services":
        return (
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
      case "Community":
        return (
          <p>
            As part of Hack Club, Nest has a community of over 100 users and
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
      default:
        return "Click on a tab to learn more about Nest!";
    }
  };

  return (
    <section className="flex flex-col items-center justify-start gap-y-8 p-4 px-4 py-8 sm:py-16 font-dm-mono text-white lg:p-16 lg:py-24 2xl:p-32">
      <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-medium 2xl:text-5xl mb-4">
        What makes up <span className="text-HCPurpleText">Nest</span>?
      </h2>
      <p className="max-w-4xl text-center text-sm sm:text-base lg:text-lg 2xl:text-xl mb-8">
        Nest is a{" "}
        <a
          href="https://www.hetzner.com/dedicated-rootserver/ex44/"
          className="text-HCPurpleText underline"
        >
          Hetzner EX44
        </a>{" "}
        dedicated server, located in Helsinki, Finland. Users share a{" "}
        <span className="italic">virtual machine</span> on the server.
      </p>
      <div className="w-full max-w-5xl rounded-lg overflow-hidden shadow-lg bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
        <div className="flex flex-wrap border-b border-violet-950">
          {["Specs", "Linux", "Services", "Community"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm sm:text-base sm:px-6 sm:py-3 ${
                component === tab
                  ? "bg-gray-800 bg-opacity-50 text-HCPurpleText"
                  : "bg-gray-900 bg-opacity-30 text-white hover:bg-gray-800 hover:bg-opacity-40"
              } transition-colors flex-grow`}
              onClick={() => setComponent(tab as "Specs" | "Linux" | "Services" | "Community")}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="p-4 sm:p-6 h-[300px] sm:h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900">
          <AnimatePresence mode="wait">
            <motion.div
              key={component}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {component === "Specs" ? (
                <div className="flex flex-col items-start gap-6">
                  <pre className="text-xs text-HCPurpleText mb-4 w-full sm:w-1/3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900">
{`
                 _   
 _ __   ___  ___| |_ 
| '_ \\ / _ \\/ __| __|
| | | |  __/\\__ \\ |_ 
|_| |_|\\___||___/\\__|
`}
                  </pre>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                    <div className="flex items-center">
                      <GoCpu className="text-3xl sm:text-4xl text-HCPurpleText mr-3" />
                      <div>
                        <div className="text-sm font-medium">Processor</div>
                        <div className="text-xs text-gray-300">i5-13500 (14 cores, 20 threads)</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <BsMemory className="text-3xl sm:text-4xl text-HCPurpleText mr-3" />
                      <div>
                        <div className="text-sm font-medium">Memory</div>
                        <div className="text-xs text-gray-300">64 GB DDR4 RAM</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <BsNvme className="text-3xl sm:text-4xl text-HCPurpleText mr-3" />
                      <div>
                        <div className="text-sm font-medium">Storage</div>
                        <div className="text-xs text-gray-300">2x 512GB NVMe SSD & 1x 1TB NVMe SSD</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <BsHddNetwork className="text-3xl sm:text-4xl text-HCPurpleText mr-3" />
                      <div>
                        <div className="text-sm font-medium">Network</div>
                        <div className="text-xs text-gray-300">1 Gbps, IPv4 & IPv6</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm">
                    <p>Nest runs on Proxmox VE 8.1.3 with two main VMs:</p>
                    <ul className="list-disc list-inside mt-2">
                      <li>Secure VM (NixOS): Hosts critical services</li>
                      <li>Nest VM (Debian 12): User-accessible environment</li>
                    </ul>
                    <p className="mt-2">
                      <a href="https://github.com/hackclub/nest/blob/main/SETUP.md" className="text-HCPurpleText hover:underline">
                        Read more about Nest&apos;s technical setup on GitHub
                      </a>
                    </p>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="font-mono text-green-400 mb-4">
                    <span className="text-blue-400">nest@hackclub:~$</span> cat {component?.toLowerCase()}.txt
                  </div>
                  <motion.div
                    className="text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    {getTextContent(component as "Specs" | "Linux" | "Services" | "Community")}
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}