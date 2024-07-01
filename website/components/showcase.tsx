import ProjectCard from "@/components/projectCard";

export default function Showcase() {
  return (
    <section className="flex flex-col items-center justify-start gap-y-1 font-dm-mono text-white 2xl:gap-y-3">
      <p className="px-2 text-center text-3xl font-medium lg:px-4 2xl:text-4xl">
        Join <span className="text-HCPurple">100 other teens</span> using Nest
      </p>
      <p className="p-4 text-center text-lg 2xl:text-xl">
        See what fellow “birds” are hosting on Nest!
      </p>
      <div className="flex flex-col items-center justify-evenly gap-x-7 gap-y-10 lg:flex-row lg:gap-y-0 lg:py-10">
        <ProjectCard
          title="Denopoll"
          author={{
            name: "samuel",
            pfp: "https://avatars.githubusercontent.com/u/79737178?v=4",
          }}
          description="Denopoll is a Slack bot used to run polls in the Hack Club Slack! It’s hosted using a Docker container and Nest Postgres."
          image="https://cloud-7f25asys7-hack-club-bot.vercel.app/0screenshot_from_2024-06-16_20-53-19.png"
          repo="https://github.com/polypixeldev/denopoll"
        />
        <ProjectCard
          title="Denopoll"
          author={{
            name: "samuel",
            pfp: "https://avatars.githubusercontent.com/u/79737178?v=4",
          }}
          description="Denopoll is a Slack bot used to run polls in the Hack Club Slack! It’s hosted using a Docker container and Nest Postgres."
          image="https://cloud-7f25asys7-hack-club-bot.vercel.app/0screenshot_from_2024-06-16_20-53-19.png"
          repo="https://github.com/polypixeldev/denopoll"
        />
        <ProjectCard
          title="Denopoll"
          author={{
            name: "samuel",
            pfp: "https://avatars.githubusercontent.com/u/79737178?v=4",
          }}
          description="Denopoll is a Slack bot used to run polls in the Hack Club Slack! It’s hosted using a Docker container and Nest Postgres."
          image="https://cloud-7f25asys7-hack-club-bot.vercel.app/0screenshot_from_2024-06-16_20-53-19.png"
          repo="https://github.com/polypixeldev/denopoll"
        />
      </div>
    </section>
  );
}
