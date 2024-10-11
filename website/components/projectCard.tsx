import Image from "next/image";
import Link from "next/link";
import { FaCode, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import type { Project } from "@/types/project";

const MAX_DESCRIPTION_LENGTH = 90;

export default function ProjectCard({ data: project }: { data: Project }) {
  const [expanded, setExpanded] = useState(false);
  const isLongDescription = project.description.length > MAX_DESCRIPTION_LENGTH;

  return (
    <article className="flex w-full flex-col rounded-lg border-2 border-violet-950 sm:w-full md:w-full lg:w-full xl:w-full 2xl:w-full">
      <Image
        src={project.image}
        width={400}
        height={200}
        alt={`Project "${project.name}"`}
        className="h-48 w-full rounded-t-md object-cover sm:h-56 md:h-64"
      />
      <div className="flex flex-col gap-y-2 p-3 sm:p-4">
        <div className="relative pb-6">
          <AnimatePresence initial={false}>
            <motion.div
              key="content"
              initial="collapsed"
              animate={expanded ? "expanded" : "collapsed"}
              exit="collapsed"
              variants={{
                expanded: { height: "auto", opacity: 1 },
                collapsed: { height: "7em", opacity: 1 },
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <h2 className="text-sm font-medium sm:text-base lg:text-lg 2xl:text-xl">
                  {project.name}
                </h2>
                <Link
                  href={project.repo}
                  aria-label={`View ${project.name} repository`}
                >
                  <FaCode
                    size={16}
                    className="text-HCPurpleText transition-colors hover:text-HCPurple"
                  />
                </Link>
              </div>
              <p className="text-xs sm:text-sm 2xl:text-base">
                {project.description}
              </p>
              {!expanded && isLongDescription && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-bg to-transparent sm:h-10" />
              )}
            </motion.div>
          </AnimatePresence>
          {isLongDescription && (
            <ExpandButton
              expanded={expanded}
              onClick={() => setExpanded(!expanded)}
            />
          )}
        </div>
        <div className="mt-1 flex items-center gap-x-2 sm:mt-2">
          <Image
            src={project.authorPfp}
            width={20}
            height={20}
            alt={project.authorName}
            className="h-5 w-5 rounded-full"
          />
          <p className="text-sm sm:text-base">{project.authorName}</p>
        </div>
      </div>
    </article>
  );
}

interface ExpandButtonProps {
  expanded: boolean;
  onClick: () => void;
}

function ExpandButton({ expanded, onClick }: ExpandButtonProps) {
  return (
    <motion.button
      className="absolute bottom-0 right-0 text-HCPurpleText transition-colors hover:text-HCPurple"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      aria-label={expanded ? "Collapse description" : "Expand description"}
    >
      {expanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
    </motion.button>
  );
}
