/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import { FaArrowRight, FaCode } from "react-icons/fa";
import ProjectCard from "@/components/projectCard";
import type { Project } from "@/types/project";

export default function Showcase(props: { projects: Project[] }) {
  return (
    <section className="flex flex-col items-center justify-start gap-y-4 font-dm-mono text-white py-8 lg:py-12">
      <p className="px-2 text-center text-3xl font-medium lg:px-4 2xl:text-4xl">
        Join <span className="text-HCPurpleText">200 other teens</span> using Nest
      </p>
      <p className="p-4 text-center text-lg 2xl:text-xl">
        See what fellow &quot;birds&quot; are hosting on Nest!
      </p>
      <div className="grid w-full grid-cols-1 gap-x-7 gap-y-10 px-5 md:grid-cols-2 lg:w-11/12 2xl:w-4/5 lg:grid-cols-3 lg:gap-y-8">
        {props.projects.map((p) => (
          <ProjectCard key={p.name} data={p} />
        ))}
      </div>
      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
      <Link
          href="https://guides.hackclub.app/index.php/Quickstart"
          className="group flex items-center gap-x-2 border-2 border-HCPurple rounded-lg bg-HCPurple px-4 py-2 font-dm-mono text-base font-medium text-white transition-all duration-300 hover:bg-HCPurple 2xl:text-xl hover:scale-105 active:scale-95"
        >
          Start your project <FaCode className="ml-2" />
        </Link>
        <Link
          href="/projects"
          className="group flex items-center gap-x-2 rounded-lg border-2 border-HCPurple px-4 py-2 font-dm-mono text-base font-medium text-HCPurpleText transition-all duration-300 hover:bg-HCPurple hover:text-white 2xl:text-xl hover:scale-105 active:scale-95"
        >
          See all projects <FaArrowRight className="ml-2" />
        </Link>
      </div>
    </section>
  );
}
