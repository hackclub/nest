import Airtable from "airtable";
import { Masonry } from "masonic";
import { useState, useEffect } from "react";
import Head from "next/head";

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
    revalidate: 3600, // Revalidate every hour
  };
};

export default function Projects({
  projects,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <>
      <Head>
        <title>Nest - Projects</title>
        <meta name="title" content="Nest - Projects" />
        <meta property="og:title" content="Nest - Projects" />
      </Head>
      <main className="min-h-screen bg-bg font-dm-mono text-white">
        <Nav />
        <h1 className="my-8 text-center text-3xl font-medium 2xl:text-4xl">
          Nest Projects
        </h1>
        <div className="px-20">
          {isLoaded && (
            <Masonry
              items={projects}
              render={ProjectCard}
              columnWidth={300}
              columnGutter={20}
              maxColumnCount={4}
            />
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}
