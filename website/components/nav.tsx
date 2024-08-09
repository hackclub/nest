import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaHome, FaServer, FaBook, FaTools } from "react-icons/fa";
import { FaGithub } from "react-icons/fa6";

const navItems = [
  {
    href: "/",
    icon: <FaHome className="hidden text-2xl md:mr-2 md:block" />,
    text: "Home",
  },
  {
    href: "/projects",
    icon: <FaTools className="text-xl sm:mr-0 md:mr-2" />,
    text: "Projects",
  },
  {
    href: "https://guides.hackclub.app/",
    icon: <FaBook className="text-xl sm:mr-0 md:mr-2" />,
    text: "Wiki",
  },
  {
    href: "https://status.hackclub.app/",
    icon: <FaServer className="text-xl sm:mr-0 md:mr-2" />,
    text: "Status",
  },
  {
    href: "https://github.com/hackclub/nest/",
    icon: <FaGithub className="sm:mr-0 md:hidden" />,
  },
];

export default function Nav() {
  return (
    <nav className="relative flex items-center justify-between border-b-2 border-violet-950 px-4 py-4 md:border-transparent md:bg-transparent md:px-16">
      <div className="flex items-center gap-x-4 md:hidden">
        <Link href={"/"}>
          <Image src={"/nest.svg"} alt="nest logo" width={70} height={70} />
        </Link>
      </div>

      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 transform items-center gap-x-4 lg:hidden">
        {navItems.map((item, index) => (
          <Link key={index} href={item.href} className="text-white">
            {item.icon}
          </Link>
        ))}
      </div>

      {/* <div className="absolute left-4 top-1/2 transform -translate-y-1/2 items-center gap-x-4 hidden lg:flex">
        <Link href={"https://hackclub.com/"}>
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            whileHover={{
              rotate: [0, 4, 0],
              transition: { duration: 1, repeat: Infinity },
            }}
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
      </div> */}

      <div className="hidden items-end justify-center gap-x-4 font-dm-mono text-white md:gap-x-12 lg:flex">
        <Link className="flex-shrink-0" href={"/"}>
          <Image src={"/nest.svg"} alt="nest logo" width={85} height={85} />
        </Link>

        {navItems.map((item, index) => (
          <Link
            key={index}
            className="hover:text-HCBlue flex items-center hover:underline"
            href={item.href}
          >
            {item.icon}{" "}
            <span className="hidden text-xl font-light md:inline 2xl:text-2xl">
              {item.text}
            </span>
          </Link>
        ))}
      </div>

      <div className="hidden items-center justify-end gap-x-4 md:gap-x-10 lg:flex">
        <a
          href="https://identity.hackclub.app"
          className="rounded-lg border-2 border-HCPurple px-4 py-1 font-dm-mono text-base font-medium text-HCPurple transition-all duration-300 hover:scale-110 hover:bg-HCPurple hover:text-white md:text-lg lg:px-6 2xl:px-8 2xl:py-1.5 2xl:text-xl"
        >
          Login
        </a>

        <a
          href="https://guides.hackclub.app/index.php/Quickstart"
          className="rounded-lg border-2 border-HCPurple bg-HCPurple px-4 py-1.5 font-dm-mono text-base font-medium text-white transition-all duration-300 hover:scale-110 hover:shadow-lg md:text-lg 2xl:px-2 2xl:text-xl"
        >
          Join Nest!
        </a>
      </div>
    </nav>
  );
}
