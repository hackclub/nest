import Link from "next/link";

import ProjectCard from "@/components/projectCard";

import type { Project } from "@/types/project";

export default function Showcase(props: { projects: Project[] }) {
  return (
    <section className="flex flex-col items-center justify-start gap-y-1 font-dm-mono text-white 2xl:gap-y-3">
      <p className="px-2 text-center text-3xl font-medium lg:px-4 2xl:text-4xl">
        Join <span className="text-HCPurple">100 other teens</span> using Nest
      </p>
      <p className="p-4 text-center text-lg 2xl:text-xl">
        See what fellow “birds” are hosting on Nest!
      </p>
      <div className="grid w-full grid-cols-1 gap-x-7 gap-y-10 px-5 md:grid-cols-2 lg:w-4/5 lg:grid-cols-3 lg:flex-row lg:gap-y-0 lg:py-10">
        {props.projects.map((p) => (
          <ProjectCard key={p.name} data={p} />
        ))}
      </div>
      <Link
        href="/projects"
        className="mt-4 flex items-center rounded-lg border-2 border-HCPurple px-2 py-1.5 font-dm-mono text-base font-medium text-HCPurple transition-all duration-300 hover:scale-110 hover:bg-HCPurple hover:text-white md:mt-0 md:text-base 2xl:text-xl"
      >
        See all projects
      </Link>
    </section>
  );
}
