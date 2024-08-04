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
      <div className="flex flex-col items-center justify-evenly gap-x-7 gap-y-10 lg:flex-row lg:gap-y-0 lg:py-10">
        {props.projects.map((p) => (
          <ProjectCard key={p.name} {...p} />
        ))}
      </div>
    </section>
  );
}
