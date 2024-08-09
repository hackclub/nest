import Image from "next/image";
import Link from "next/link";
import { FaCode } from "react-icons/fa";

import type { Project } from "@/types/project";

export default function ProjectCard({ data: project }: { data: Project }) {
  return (
    <div className="flex flex-col items-center justify-start rounded-lg">
      <Image
        src={project.image}
        width={400}
        height={80}
        alt={`Image of project "${project.name}"`}
        className="rounded-t-md"
      />
      <div className="flex flex-col items-start justify-start gap-y-2 rounded-lg rounded-t-none border-2 border-t-0 border-violet-950 p-5">
        <div className="flex w-full items-center justify-between">
          <p className="text-lg font-medium 2xl:text-xl">{project.name}</p>
          <Link href={project.repo}>
            <FaCode size={20} />
          </Link>
        </div>
        <p className="text-sm 2xl:text-base">{project.description}</p>
        <div className="flex items-center justify-start gap-x-3">
          <Image
            src={project.authorPfp}
            width={20}
            height={20}
            alt={`Image of ${project.authorName}`}
          />
          <p className="text-sm">{project.authorName}</p>
        </div>
      </div>
    </div>
  );
}
