import Image from "next/image";
import Link from "next/link";
import {
  FaHome,
  FaServer,
  FaBook,
  FaTools,
  FaTerminal,
  FaCode,
  FaGithub,
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
    <span className="transition-transform group-hover:scale-110">{icon}</span>
    <span className="hidden border-b-2 border-transparent group-hover:border-HCPurpleText md:inline">
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
  return (
    <nav className="relative flex items-center justify-between border-b-2 border-violet-950 px-4 py-4 md:border-transparent md:bg-transparent md:px-16">
      <div className="flex items-center gap-x-4 md:hidden">
        <Link href="/" className="transition-transform hover:scale-105">
          <Image src="/nest.svg" alt="Nest logo" width={70} height={70} />
        </Link>
      </div>

      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 transform items-center gap-x-6 lg:hidden">
        {navItems.map((item, index) => (
          <NavLink key={index} {...item} className="text-white" />
        ))}
      </div>

      <div className="hidden items-end justify-center gap-x-4 font-dm-mono text-white md:gap-x-12 lg:flex">
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
