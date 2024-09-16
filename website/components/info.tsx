import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoCpu } from "react-icons/go";
import { BsMemory, BsNvme, BsHddNetwork } from "react-icons/bs";
import Link from "next/link";

type TabType = "Specs" | "Linux" | "Services" | "Community";

interface TabContentProps {
  content: React.ReactNode;
  activeTab: TabType | null;
}

const TabContent: React.FC<TabContentProps> = ({ content, activeTab }) => (
  <motion.div
    initial={{ height: 0 }}
    animate={{ height: "auto" }}
    exit={{ height: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="mb-4 font-mono text-green-400">
      <span className="text-blue-400">nest@hackclub:~$</span> cat{" "}
      {activeTab?.toLowerCase()}.txt
    </div>
    <motion.div
      className="text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      {content}
    </motion.div>
  </motion.div>
);

const SpecsContent: React.FC = () => (
  <div className="flex flex-col items-start gap-6">
    <pre className="mb-4 w-full overflow-x-auto text-xs text-HCPurpleText scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-600 sm:w-1/3">
      {`
                 _   
 _ __   ___  ___| |_ 
| '_ \\ / _ \\/ __| __|
| | | |  __/\\__ \\ |_ 
|_| |_|\\___||___/\\__|
`}
    </pre>
    <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
      {[
        {
          Icon: GoCpu,
          title: "Processor",
          desc: "i5-13500 (14 cores, 20 threads)",
        },
        { Icon: BsMemory, title: "Memory", desc: "64 GB DDR4 RAM" },
        {
          Icon: BsNvme,
          title: "Storage",
          desc: "2x 512GB NVMe SSD & 1x 1TB NVMe SSD",
        },
        { Icon: BsHddNetwork, title: "Network", desc: "1 Gbps, IPv4 & IPv6" },
      ].map(({ Icon, title, desc }) => (
        <div key={title} className="flex items-center">
          <Icon className="mr-3 text-3xl text-HCPurpleText sm:text-4xl" />
          <div>
            <div className="text-sm font-medium">{title}</div>
            <div className="text-xs text-gray-300">{desc}</div>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-4 text-sm">
      <p>
        Nest runs on a{" "}
        <Link
          href="https://www.hetzner.com/dedicated-rootserver/ex101/"
          className="text-HCPurpleText hover:underline"
        >
          Hetzner EX101
        </Link>{" "}
        dedicated server, located in Helsinki, Finland. It uses Proxmox VE 8.1.3
        with two main VMs:
      </p>
      <ul className="mt-2 list-inside list-disc">
        <li>Secure VM (NixOS): Hosts critical services</li>
        <li>Nest VM (Debian 12): User-accessible environment</li>
      </ul>
      <p className="mt-2">
        <Link
          href="https://github.com/hackclub/nest/blob/main/SETUP.md"
          className="text-HCPurpleText hover:underline"
        >
          Read more about Nest&apos;s technical setup on GitHub
        </Link>
      </p>
    </div>
  </div>
);

export default function Info() {
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [count, setCount] = useState(200);

  useEffect(() => {
    fetch("/api/userCount")
      .then((r) => r.json())
      .then((d) => setCount(d.count));
  }, []);

  const tabContent: Record<TabType, React.ReactNode> = {
    Specs: <SpecsContent />,
    Linux: (
      <p>
        Every computer that you use has an operating system. An operating system
        manages your computer&apos;s resources and makes sure that everything
        running on your computer, from the internal system tools to the web
        browser you&apos;re using to read this, has time to run.
        <br />
        <br />
        Popular operating systems include Windows, MacOS, and Linux! Linux
        isn&apos;t used as much as Windows and MacOS for personal computers, but
        it&apos;s still popular among developers and enthusiasts. However, Linux
        is the standard for servers! That&apos;s why we use Linux for Nest.
        It&apos;s a little different from what you might be used to, but
        you&apos;ll be working with Linux in no time!
        <br />
        <br />
        <Link
          href="https://guides.hackclub.app/index.php/Linux"
          className="text-HCPurpleText hover:underline"
        >
          Learn more about Linux on Nest Guides
        </Link>
      </p>
    ),
    Services: (
      <p>
        Nest provides a collection of services to help you host your projects!
        These include{" "}
        <Link
          href="https://guides.hackclub.app/index.php/PostgreSQL"
          className="text-HCPurpleText hover:underline"
        >
          Nest Postgres
        </Link>{" "}
        (easy to use Postgres database),{" "}
        <Link href="https://identity.hackclub.app">Nest Identity</Link> for
        authentication, and{" "}
        <Link
          href="https://guides.hackclub.app/index.php/Caddy"
          className="text-HCPurpleText hover:underline"
        >
          Caddy
        </Link>{" "}
        for a webserver.
      </p>
    ),
    Community: (
      <p>
        As part of Hack Club, Nest has a community of {count} users and others
        in the{" "}
        <Link
          href="https://hackclub.com/slack"
          className="text-HCPurpleText hover:underline"
        >
          Hack Club Slack
        </Link>{" "}
        who are happy to help you with any issues you might encounter. The{" "}
        <Link
          href="https://hackclub.slack.com/archives/C056WDR3MQR"
          className="text-HCPurpleText hover:underline"
        >
          #nest
        </Link>{" "}
        channel on Slack is the best place to ask any questions related to Nest,
        and you can also ask in other channels like{" "}
        <Link href="https://hackclub.slack.com/archives/C0EA9S0A0">#code</Link>{" "}
        if you have a question related to your project.
        <br />
        <br />
        Nest also has a team of 5 active admins who are able to assist you with
        any requests you might have. You can ping them on Slack with the
        @nestadmins user group.
      </p>
    ),
  };

  return (
    <section className="flex flex-col items-center justify-start gap-y-8 px-4 py-8 font-dm-mono text-white lg:px-16 lg:py-12 2xl:px-32 2xl:py-16">
      <h2 className="px-2 text-center text-3xl font-medium sm:text-3xl md:text-4xl 2xl:text-5xl">
        What makes up <span className="text-HCPurpleText">Nest</span>?
      </h2>
      <p className="mb-8 max-w-4xl text-center text-lg 2xl:text-xl">
        Nest is a{" "}
        <Link
          href="https://www.hetzner.com/dedicated-rootserver/ex44/"
          className="text-HCPurpleText hover:underline"
        >
          Hetzner EX44
        </Link>{" "}
        dedicated server, located in Helsinki, Finland. Users share a{" "}
        <span className="italic">virtual machine</span> on the server.
      </p>
      <div className="w-11/12 overflow-hidden rounded-lg bg-gradient-to-b from-[#1a1a2e] to-[#16213e] shadow-lg 2xl:max-w-7xl">
        <div className="flex flex-wrap border-b border-violet-950">
          {(Object.keys(tabContent) as TabType[]).map((tab) => (
            <button
              key={tab}
              className={`flex-grow px-4 py-2 text-sm transition-colors sm:px-6 sm:py-3 sm:text-base ${
                activeTab === tab
                  ? "bg-gray-800 bg-opacity-50 text-HCPurpleText"
                  : "bg-gray-900 bg-opacity-30 text-white hover:bg-gray-800 hover:bg-opacity-40"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="h-[400px] overflow-y-auto p-4 scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-600 sm:h-[500px] sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab ? (
                <TabContent
                  content={tabContent[activeTab]}
                  activeTab={activeTab}
                />
              ) : (
                "Click on a tab to learn more about Nest!"
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
