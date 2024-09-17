import { useState } from "react";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { GetStaticProps, InferGetStaticPropsType } from "next/types";
import { getProjects } from "@/utils/getProjects";
import ProjectCard from "@/components/projectCard";
import type { Project } from "@/types/project";

export const getStaticProps: GetStaticProps<{
  projects: Project[];
}> = async () => {
  const projects = await getProjects();

  return {
    props: {
      projects,
    },
    revalidate: 3600, // Revalidate every hour
  };
};

export default function Projects({
  projects,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    "All",
    "Websites",
    "Bots",
    "Game_Servers",
    "Backends",
    "Other",
  ];

  const filteredProjects =
    selectedCategory && selectedCategory !== "All"
      ? projects.filter((p) => p.category === selectedCategory)
      : projects;

  return (
    <>
      <Head>
        <title>Nest - Projects</title>
        <meta name="title" content="Nest - Projects" />
        <meta property="og:title" content="Nest - Projects" />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 bg-gradient-to-r from-HCPurpleText to-HCPurple bg-clip-text text-center text-4xl font-medium text-transparent">
          Nest Projects
        </h1>
        <div className="mb-8 rounded-lg bg-gradient-to-b from-[#1a1a2e] to-[#16213e] p-4 shadow-lg">
          <div className="mb-2 font-mono text-green-400">
            <span className="text-blue-400">nest@hackclub:~$</span> ls
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`rounded px-3 py-1 text-sm transition-colors ${
                selectedCategory === "All"
                  ? "bg-HCPurple text-white"
                  : "bg-gray-800 text-HCPurpleText hover:bg-gray-700"
              }`}
            >
              categories/
            </button>
            <Link
              href="#"
              className={`rounded bg-gray-800 px-3 py-1 text-sm text-HCPurpleText transition-colors hover:bg-gray-700`}
            >
              register_project.sh
            </Link>
          </div>
          {selectedCategory === "All" ? (
            <div className="mb-2 font-mono text-green-400">
              <span className="text-blue-400">nest@hackclub:~$</span> ls
              categories/
            </div>
          ) : (
            <div className="mb-2 font-mono text-green-400">
              <span className="text-blue-400">nest@hackclub:~$</span> cat
              categories/{selectedCategory.toLowerCase()}.txt
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded px-3 py-1 text-sm transition-colors ${
                  selectedCategory === category
                    ? "bg-HCPurple text-white"
                    : "bg-gray-800 text-HCPurpleText hover:bg-gray-700"
                }`}
              >
                {category.toLowerCase()}.txt
              </button>
            ))}
          </div>
        </div>
        <AnimatePresence>
          <motion.div
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {filteredProjects.map((project) => (
              <motion.div
                key={project.name}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ProjectCard data={project} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
