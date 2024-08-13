import Airtable from "airtable";
import { Masonry } from "masonic";
import { useState, useEffect } from "react";

import Nav from "@/components/nav";
import ProjectCard from "@/components/projectCard";
import Footer from "@/components/footer";

import type { InferGetStaticPropsType } from "next/types";
import type { Project } from "@/types/project";

export const getStaticProps = async () => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE!,
  );

  const projects = await base
    .table("Showcase")
    .select({
      filterByFormula: "{Show}",
    })
    .all();

  return {
    props: {
      projects: projects.map((p) => ({
        name: p.get("Name"),
        description: p.get("Description"),
        repo: p.get("Repo"),
        authorName: p.get("Author Name"),
        authorPfp: p.get("Author PFP"),
        image: p.get("Image"),
        featured: p.get("Featured") ?? false,
      })) as Project[],
    },
  };
};

export default function Projects(
  props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-bg font-dm-mono text-white">
      <Nav />
      <p className="my-8 px-2 text-center text-3xl font-medium lg:px-4 2xl:text-4xl">
        Nest Projects
      </p>
      <div className="px-20">
        {/* Hacky way to make sure this doesn't try to render on the server */}
        {isLoaded && (
          <Masonry
            items={props.projects}
            render={ProjectCard}
            columnWidth={300}
            columnGutter={20}
            maxColumnCount={4}
          />
        )}
      </div>
      <Footer />
    </main>
  );
}
