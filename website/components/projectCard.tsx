import Image from "next/image";
import Link from "next/link";
import { FaCode, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import type { Project } from "@/types/project";

export default function ProjectCard({ data: project }: { data: Project }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col items-center justify-start rounded-lg w-full sm:w-[350px] md:w-[400px]">
      <Image
        src={project.image}
        width={400}
        height={200}
        alt={`Image of project "${project.name}"`}
        className="rounded-t-md object-cover w-full h-[200px]"
      />
      <div className="flex flex-col items-start justify-start gap-y-2 rounded-lg rounded-t-none border-2 border-t-0 border-violet-950 p-4 w-full relative">
        <div className="flex w-full items-center justify-between">
          <p className="text-base sm:text-lg font-medium 2xl:text-xl">{project.name}</p>
          <Link href={project.repo}>
            <FaCode size={18} className="text-HCPurpleText hover:text-HCPurple transition-colors" />
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
                collapsed: { height: "80px", opacity: 1 }
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden relative"
            >
              <p className="text-xs sm:text-sm 2xl:text-base">{project.description}</p>
              {!expanded && project.description.length > 110 && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-bg to-transparent" />
              )}
            </motion.div>
          </AnimatePresence>
          {project.description.length > 110 && (
            <motion.button
              className="absolute bottom-0 right-0 text-HCPurpleText hover:text-HCPurple transition-colors"
              onClick={() => setExpanded(!expanded)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: expanded || project.description.length > 110 ? 1 : 0 }}
            >
              {expanded ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
            </motion.button>
          )}
        </div>
        <div className="flex items-center justify-start gap-x-2 mt-2">
          <Image
            src={project.authorPfp}
            width={16}
            height={16}
            alt={`Image of ${project.authorName}`}
            className="rounded-full"
          />
          <p className="text-xs sm:text-sm">{project.authorName}</p>
        </div>
      </div>
    </div>
  );
}