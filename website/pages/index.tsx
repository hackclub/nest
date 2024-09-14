import { GetStaticProps, InferGetStaticPropsType } from "next/types";
import { getProjects } from "@/utils/getProjects";
import Hero from "@/components/hero";
import Showcase from "@/components/showcase";
import Signup from "@/components/signup";
import Info from "@/components/info";
import { Project } from "@/types/project";

export const getStaticProps: GetStaticProps<{
  featuredProjects: Project[];
}> = async () => {
  const projects = await getProjects();

  return {
    props: {
      featuredProjects: projects.filter((p) => p.featured),
    },
    revalidate: 3600, // Revalidate every hour (60 * 60 seconds)
  };
};

export default function Home({
  featuredProjects,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Hero />
      <Signup />
      <Info />
      <Showcase projects={featuredProjects} />
    </>
  );
}
