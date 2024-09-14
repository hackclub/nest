import { GetStaticProps, InferGetStaticPropsType } from "next/types";
import Airtable from "airtable";

import Nav from "@/components/nav";
import Hero from "@/components/hero";
import Showcase from "@/components/showcase";
import Info from "@/components/info";
import Footer from "@/components/footer";
import { Project } from "@/types/project";

export const getStaticProps: GetStaticProps<{
  featuredProjects: Project[];
}> = async () => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE!,
  );

  const projects = await base
    .table("Showcase")
    .select({ filterByFormula: "{Featured}" })
    .all();

  return {
    props: {
      featuredProjects: projects.map((p) => ({
        name: p.get("Name"),
        description: p.get("Description"),
        repo: p.get("Repo"),
        authorName: p.get("Author Name"),
        authorPfp: p.get("Author PFP"),
        image: p.get("Image"),
        featured: p.get("Featured"),
      })) as Project[],
    },
    revalidate: 3600, // Revalidate every hour (60 * 60 seconds)
  };
};

export default function Home({
  featuredProjects,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <main className="scrollbar-custom min-h-screen overflow-hidden bg-bg">
      <Nav />
      <Hero />
      <Showcase projects={featuredProjects} />
      <Info />
      <Footer />
    </main>
  );
}
