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
    <div className="flex flex-col items-center justify-start rounded-lg">
      <Image
        src={props.image}
        width={100}
        height={80}
        alt={`Image of project "${props.title}"`}
      />
      <div className="border-2 border-t-0 border-HCPurple">
        <div className="flex items-center justify-between">
          <p>{props.title}</p>
          <Link href={props.repo}>
            <FaGithub />
          </Link>
        </div>
        <p>{props.description}</p>
        <div className="flex items-center justify-start">
          <Image
            src={props.author.pfp}
            width={10}
            height={10}
            alt={`Image of ${props.author.name}`}
          />
          <p>{props.author.name}</p>
        </div>
      </div>
    </div>
  );
}
