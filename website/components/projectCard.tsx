import Image from "next/image";
import Link from "next/link";
import { FaCode } from "react-icons/fa";

import type { Project } from "@/types/project";

export default function ProjectCard(props: Project) {
  return (
    <div className="flex w-5/6 flex-col items-center justify-start rounded-lg lg:w-1/4 2xl:w-1/5">
      <Image
        src={props.image}
        width={400}
        height={80}
        alt={`Image of project "${props.name}"`}
        className="rounded-t-md"
      />
      <div className="flex flex-col items-start justify-start gap-y-2 rounded-lg rounded-t-none border-2 border-t-0 border-violet-950 p-5">
        <div className="flex w-full items-center justify-between">
          <p className="text-lg font-medium 2xl:text-xl">{props.name}</p>
          <Link href={props.repo}>
            <FaCode size={20} />
          </Link>
        </div>
        <p className="text-sm 2xl:text-base">{props.description}</p>
        <div className="flex items-center justify-start gap-x-3">
          <Image
            src={props.authorPfp}
            width={20}
            height={20}
            alt={`Image of ${props.authorName}`}
          />
          <p className="text-sm">{props.authorName}</p>
        </div>
      </div>
    </div>
  );
}
