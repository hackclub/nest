import Airtable from "airtable";

import Nav from "@/components/nav";
import Hero from "@/components/hero";
import Showcase from "@/components/showcase";
import Info from "@/components/info";
import Footer from "@/components/footer";

import type { InferGetStaticPropsType } from "next/types";
import type { Project } from "@/types/project";

export const getStaticProps = async () => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE!,
  );

  const projects = await base.table("Showcase").select({}).all();

  return {
    props: {
      projects: projects.map((p) => ({
        name: p.get("Name"),
        description: p.get("Description"),
        repo: p.get("Repo"),
        authorName: p.get("Author Name"),
        authorPfp: p.get("Author PFP"),
        image: p.get("Image"),
      })) as Project[],
    },
  };
};

export default function Home(
  props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  return (
    <main className="min-h-screen overflow-hidden bg-bg">
      <Nav />
      <Hero />
      <Showcase projects={props.projects} />
      <Info />
      <Footer />
    </main>
  );
}
