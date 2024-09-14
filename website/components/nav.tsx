import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHome,
  FaServer,
  FaBook,
  FaTools,
  FaTerminal,
  FaCode,
  FaGithub,
  FaBars,
  FaTimes
} from "react-icons/fa";

interface NavItem {
  href: string;
  icon: JSX.Element;
  text: string;
}


const navItems: NavItem[] = [
  {
    href: "/",
    icon: <FaHome className="text-2xl md:mr-2" />,
    text: "Home",
  },
  {
    href: "/projects",
    icon: <FaTools className="text-xl md:mr-2" />,
    text: "Projects",
  },
  {
    href: "https://guides.hackclub.app/",
    icon: <FaBook className="text-xl md:mr-2" />,
    text: "Wiki",
  },
  {
    href: "https://status.hackclub.app/",
    icon: <FaServer className="text-xl md:mr-2" />,
    text: "Status",
  },
  {
    href: "https://github.com/hackclub/nest/",
    icon: <FaGithub className="text-xl md:mr-2" />,
    text: "GitHub",
  },
];

const NavLink: React.FC<NavItem & { className?: string }> = ({
  href,
  icon,
  text,
  className,
}) => (
  <Link
    href={href}
    className={`group flex items-center text-xl font-light transition-colors hover:text-HCPurpleText ${className}`}
  >
    <span className="transition-transform group-hover:scale-110 mr-2">{icon}</span>
    <span className="border-b-2 border-transparent group-hover:border-HCPurpleText">
      {text}
    </span>
  </Link>
);

const ActionButton: React.FC<{
  href: string;
  icon: JSX.Element;
  text: string;
  primary?: boolean;
}> = ({ href, icon, text, primary }) => (
  <Link
    href={href}
    className={`group flex items-center gap-x-2 rounded-lg border-2 border-HCPurple px-4 py-2 font-dm-mono text-base font-medium transition-all duration-300 hover:scale-105 active:scale-95 2xl:text-xl ${
      primary
        ? "bg-HCPurple text-white"
        : "text-HCPurpleText hover:bg-HCPurple hover:text-white"
    }`}
  >
    {icon}
    <span>{text}</span>
  </Link>
);


export default function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
  }, [isOpen]);
  
  return (
    <nav className="sticky bg-[#03001c] top-0 z-50 w-full md:relative flex items-center justify-between border-b-2 border-violet-950 px-4 py-4 lg:border-transparent md:bg-transparent lg:px-16">
      <div className="flex items-end right-0 gap-x-4 md:hidden">
        <Link href="/" className="transition-transform hover:scale-105">
          <Image src="/nest.svg" alt="Nest logo" width={70} height={70} />
        </Link>
      </div>

      <div className="hidden items-end justify-center gap-x-4 font-dm-mono text-white md:gap-x-9 md:flex ">
        <Link
          href="/"
          className="flex-shrink-0 transition-transform hover:scale-105"
        >
          <Image src="/nest.svg" alt="Nest logo" width={85} height={85} />
        </Link>
        {navItems.map((item, index) => (
          <NavLink key={index} {...item} className="2xl:text-2xl" />
        ))}
      </div>

      <div className="flex md:hidden justify-end bg-[#03001c] shadow-lg">
      <button className = "z-50" onClick ={() => setIsOpen(!isOpen)}>
         {isOpen ? (
          <FaTimes className="text-xl "/>
            ) : (
          <FaBars className="text-xl "/>)}
        </button>

        <div className = {`${isOpen ? "absolute": "hidden"} z-40 gap-y-10 w-screen h-screen mt-10 p-5 right-0 border-t-2 border-violet-950  backdrop-blur-[400px] backdrop-brightness-50 transition-opacity`}>
        <button onClick={() => setIsOpen(false)}>
          {isOpen ? (
            navItems.map((item, index) => (
             <NavLink key={index} {...item} className="text-white ml-5 py-5" /> ))  
            ) : ( null
          )}
          </button>
        </div>
      </div>

      <div className="hidden translate-y-[-20px] animate-[fadeInDown_0.5s_ease-out_forwards] items-center justify-end gap-x-6 opacity-0 lg:flex">
        <ActionButton
          href="https://guides.hackclub.app/index.php/Quickstart"
          icon={<FaCode className="text-xl" />}
          text="Join Nest!"
          primary
        />
        <ActionButton
          href="https://identity.hackclub.app"
          icon={<FaTerminal className="text-xl" />}
          text="Login"
        />
      </div>
    </nav>
  );
}
