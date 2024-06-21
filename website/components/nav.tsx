import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaHome, FaSignal, FaBook } from "react-icons/fa";

export default function Nav() {
  return (
    <nav className="flex flex-wrap items-center justify-between px-16 py-4">
      <div className="flex items-center gap-x-4 self-end font-dm-mono text-base font-medium text-white md:gap-x-12 md:text-lg lg:gap-x-20 lg:text-2xl">
        {/* Animated Orpheus because why not */}
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
              className="-my-4"
            />
          </motion.div>
        </Link>

        {/* Nest Logo */}
        <Link className="flex-shrink-0" href={"/"}>
          <Image src={"/nest.svg"} alt="nest logo" width={85} height={85} />
        </Link>

        <Link
          className="hover:text-HCBlue flex items-center hover:underline"
          href={"/"}
        >
          <FaHome className="mr-1" /> Home
        </Link>
        <Link
          className="hover:text-HCBlue flex items-center hover:underline"
          href={"https://guides.hackclub.app/"}
        >
          <FaBook className="mr-1" /> Wiki
        </Link>
        <Link
          className="hover:text-HCBlue flex items-center hover:underline"
          href={"https://status.hackclub.app/"}
        >
          <FaSignal className="mr-1" /> Status
        </Link>
      </div>

      <div className="flex items-center justify-start gap-x-10">
        <a
          href="https://identity.hackclub.app"
          className="mt-4 rounded-lg border-2 border-HCPurple px-8 py-1.5 font-dm-mono text-base font-medium text-HCPurple transition-all duration-300 hover:scale-110 hover:bg-HCPurple hover:text-white md:mt-0 md:text-lg lg:text-xl"
        >
          Login
        </a>

        <a
          href="https://guides.hackclub.app/index.php/Quickstart"
          className="mt-4 rounded-lg bg-HCPurple px-2 py-1.5 font-dm-mono text-base font-medium text-white transition-all duration-300 hover:scale-110 hover:shadow-lg md:mt-0 md:text-lg lg:text-xl"
        >
          Join Nest!
        </a>
      </div>
    </nav>
  );
}
