import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaHome, FaServer, FaBook } from "react-icons/fa";

const navItems = [
  { href: "/", icon: <FaHome className="mr-2" />, text: "Home" },
  { href: "https://guides.hackclub.app/", icon: <FaBook className="mr-2" />, text: "Wiki" },
  { href: "https://status.hackclub.app/", icon: <FaServer className="mr-2" />, text: "Status" },
];

export default function Nav() {
  return (
    <nav className="flex items-center justify-between px-4 py-4 md:px-16 relative">
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-x-4">
        <Link href={"https://hackclub.com/"}>
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1 }}
            className="flex-shrink-0"
          >
            <Image
              src={"https://assets.hackclub.com/flag-orpheus-top.svg"}
              alt="hc logo"
              width={125}
              height={125}
              className="mb-1"
            />
          </motion.div>
        </Link>
      </div>

      <div className="ml-24 md:ml-32 flex items-center justify-center gap-x-4 md:gap-x-12 font-dm-mono text-base font-medium text-white md:text-lg lg:text-2xl">
        <Link className="flex-shrink-0" href={"/"}>
          <Image src={"/nest.svg"} alt="nest logo" width={85} height={85} />
        </Link>

        {navItems.map((item, index) => (
          <Link
            key={index}
            className="hover:text-HCBlue flex items-center hover:underline"
            href={item.href}
          >
            {item.icon} {item.text}
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-end gap-x-4 md:gap-x-10">
        <a
          href="https://identity.hackclub.app"
          className="rounded-lg border-2 border-HCPurple px-4 py-1.5 md:px-8 font-dm-mono text-base font-medium text-HCPurple transition-all duration-300 hover:scale-110 hover:bg-HCPurple hover:text-white md:text-lg lg:text-xl"
        >
          Login
        </a>

        <a
          href="https://guides.hackclub.app/index.php/Quickstart"
          className="rounded-lg bg-HCPurple px-4 py-1.5 md:px-2 font-dm-mono text-base font-medium text-white transition-all duration-300 hover:scale-110 hover:shadow-lg md:text-lg lg:text-xl"
        >
          Join Nest!
        </a>
      </div>
    </nav>
  );
}
