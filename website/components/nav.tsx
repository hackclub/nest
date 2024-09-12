import Image from "next/image";
import Link from "next/link";
import { FaHome, FaServer, FaBook, FaTools, FaTerminal, FaCode } from "react-icons/fa";
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
        <Link href={"/"} className="transition-transform hover:scale-105">
          <Image src={"/nest.svg"} alt="nest logo" width={70} height={70} />
        </Link>
      </div>

      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 transform items-center gap-x-6 lg:hidden">
        {navItems.map((item, index) => (
          <Link key={index} href={item.href} className="text-white hover:text-HCPurpleText transition-colors">
            {item.icon}
          </Link>
        ))}
      </div>

      <div className="hidden items-end justify-center gap-x-4 font-dm-mono text-white md:gap-x-12 lg:flex">
        <Link className="flex-shrink-0 transition-transform hover:scale-105" href={"/"}>
          <Image src={"/nest.svg"} alt="nest logo" width={85} height={85} />
        </Link>

        {navItems.map((item, index) => (
          <Link
            key={index}
            className="group flex items-center text-xl font-light transition-colors hover:text-HCPurpleText 2xl:text-2xl"
            href={item.href}
          >
            <span className="mr-2 transition-transform group-hover:scale-110">{item.icon}</span>
            <span className="hidden border-b-2 border-transparent md:inline group-hover:border-HCPurpleText">
              {item.text}
            </span>
          </Link>
        ))}
      </div>

      <div className="hidden items-center justify-end gap-x-6 lg:flex opacity-0 translate-y-[-20px] animate-[fadeInDown_0.5s_ease-out_forwards]">
        <a
          href="https://identity.hackclub.app"
          className="group flex items-center gap-x-2 rounded-lg border-2 border-HCPurple px-4 py-2 font-dm-mono text-base font-medium text-HCPurpleText transition-all duration-300 hover:bg-HCPurple hover:text-white md:text-lg 2xl:text-xl hover:scale-105 active:scale-95"
        >
          <FaTerminal className="text-xl" />
          <span>Login</span>
        </a>

        <a
          href="https://guides.hackclub.app/index.php/Quickstart"
          className="group flex items-center gap-x-2 rounded-lg bg-HCPurple px-4 py-2 font-dm-mono text-base font-medium text-white transition-all duration-300 hover:bg-HCPurpleText md:text-lg 2xl:text-xl hover:scale-105 active:scale-95"
        >
          <FaCode className="text-xl" />
          <span>Join Nest!</span>
        </a>
      </div>
    </nav>
  );
}
