/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import { useState, useEffect } from "react";
import { FaArrowRight, FaCode } from "react-icons/fa";
import ProjectCard from "@/components/projectCard";
import type { Project } from "@/types/project";

interface ShowcaseProps {
  projects: Project[];
}

const ButtonLink: React.FC<{
  href: string;
  className: string;
  children: React.ReactNode;
}> = ({ href, className, children }) => (
  <Link
    href={href}
    className={`group flex items-center gap-x-2 rounded-lg border-2 border-HCPurple px-4 py-2 font-dm-mono text-base font-medium transition-all duration-300 hover:scale-105 active:scale-95 2xl:text-xl ${className}`}
  >
    {children}
  </Link>
);

export default function Showcase({ projects }: ShowcaseProps) {
  const [count, setCount] = useState(200);

  useEffect(() => {
    fetch("/api/userCount")
      .then((r) => r.json())
      .then((d) => setCount(d.count));
  }, []);

  return (
    <section className="flex flex-col items-center gap-y-4 px-4 py-8 font-dm-mono text-white lg:px-16 lg:py-12 2xl:px-32 2xl:py-16">
      <h2 className="px-2 text-center text-3xl font-medium sm:text-3xl md:text-4xl 2xl:text-5xl">
        Join <span className="text-HCPurpleText">{count} other teens</span>{" "}
        using Nest
      </h2>
      <p className="p-4 text-center text-lg 2xl:text-xl">
        See what fellow &quot;birds&quot; are hosting on Nest!
      </p>
      <div className="grid w-full grid-cols-1 gap-7 px-5 md:grid-cols-2 lg:w-11/12 lg:grid-cols-3 2xl:w-4/5">
        {projects.map((project) => (
          <ProjectCard key={project.name} data={project} />
        ))}
      </div>
      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
        <ButtonLink
          href="https://guides.hackclub.app/index.php/Quickstart"
          className="bg-HCPurple text-white"
        >
          Start your project <FaCode className="ml-2" />
        </ButtonLink>
        <ButtonLink
          href="/projects"
          className="text-HCPurpleText hover:bg-HCPurple hover:text-white"
        >
          See all projects <FaArrowRight className="ml-2" />
        </ButtonLink>
      </div>
    </section>
  );
}
