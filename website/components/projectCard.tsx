import Image from "next/image";
import Link from "next/link";
import { FaCode, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import type { Project } from "@/types/project";

export default function ProjectCard({ data: project }: { data: Project }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col items-center justify-start rounded-lg w-full sm:w-[300px] md:w-[320px] lg:w-[350px] xl:w-[400px]">
      <Image
        src={project.image}
        width={400}
        height={200}
        alt={`Image of project "${project.name}"`}
        className="rounded-t-md object-cover w-full h-[150px] sm:h-[180px] md:h-[200px]"
      />
      <div className="flex flex-col items-start justify-start gap-y-2 rounded-lg rounded-t-none border-2 border-t-0 border-violet-950 p-3 sm:p-4 w-full relative">
        <div className="flex w-full items-center justify-between">
          <p className="text-sm sm:text-base lg:text-lg font-medium 2xl:text-xl">{project.name}</p>
          <Link href={project.repo}>
            <FaCode size={16} className="text-HCPurpleText hover:text-HCPurple transition-colors" />
          </Link>
        </div>
        <div className="relative w-full pb-6">
          <AnimatePresence initial={false}>
            <motion.div
              key="content"
              initial="collapsed"
              animate={expanded ? "expanded" : "collapsed"}
              exit="collapsed"
              variants={{
                expanded: { height: "auto", opacity: 1 },
                collapsed: { height: "60px", opacity: 1 }
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden relative"
            >
              <p className="text-xs sm:text-sm 2xl:text-base">{project.description}</p>
              {!expanded && project.description.length > 90 && (
                <div className="absolute bottom-0 left-0 right-0 h-8 sm:h-10 bg-gradient-to-t from-bg to-transparent" />
              )}
            </motion.div>
          </AnimatePresence>
          {project.description.length > 90 && (
            <motion.button
              className="absolute bottom-0 right-0 text-HCPurpleText hover:text-HCPurple transition-colors"
              onClick={() => setExpanded(!expanded)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: expanded || project.description.length > 90 ? 1 : 0 }}
            >
              {expanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </motion.button>
          )}
        </div>
        <div className="flex items-center justify-start gap-x-2 mt-1 sm:mt-2">
          <Image
            src={project.authorPfp}
            width={20}
            height={20}
            alt={`Image of ${project.authorName}`}
            className="rounded-full"
          />
          <p className="text-base">{project.authorName}</p>
        </div>
      </div>
    </div>
  );
}