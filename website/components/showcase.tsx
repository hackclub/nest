import ProjectCard from "@/components/projectCard";

export default function Showcase() {
  return (
    <section className="flex flex-col items-center justify-start gap-y-3 font-dm-mono text-white">
      <p className="text-4xl font-medium px-4 text-center">
        Join <span className="text-HCPurple">100 other teens</span> using Nest
      </p>
      <p className="lg:text-xl text-lg p-4 text-center">See what fellow “birds” are hosting on Nest!</p>
      <div className="flex items-center justify-evenly lg:py-10 flex-col lg:flex-row gap-y-10 lg:gap-y-0">
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
