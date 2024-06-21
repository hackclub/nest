import Image from "next/image";
import Link from "next/link";
import { FaGithub } from "react-icons/fa";

type ProjectCardProps = {
  title: string;
  description: string;
  image: string;
  repo: string;
  author: {
    pfp: string;
    name: string;
  };
};

export default function ProjectCard(props: ProjectCardProps) {
  return (
    <div className="flex w-1/6 flex-col items-center justify-start rounded-lg">
      <Image
        src={props.image}
        width={350}
        height={80}
        alt={`Image of project "${props.title}"`}
      />
      <div className="flex flex-col items-start justify-start gap-y-2 rounded-lg rounded-t-none border-2 border-t-0 border-HCPurple p-5">
        <div className="flex w-full items-center justify-between">
          <p className="text-xl font-medium">{props.title}</p>
          <Link href={props.repo}>
            <FaGithub size={20} />
          </Link>
        </div>
        <p>{props.description}</p>
        <div className="flex items-center justify-start gap-x-3">
          <Image
            src={props.author.pfp}
            width={25}
            height={25}
            alt={`Image of ${props.author.name}`}
          />
          <p>{props.author.name}</p>
        </div>
      </div>
    </div>
  );
}
