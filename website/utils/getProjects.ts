import Airtable from "airtable";
import { Project } from "@/types/project";

export async function getProjects(): Promise<Project[]> {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE!,
  );

  const projects = await base
    .table("Showcase")
    .select({
      filterByFormula: "{Show}",
    })
    .all();

  return projects.map((p) => ({
    name: p.get("Name"),
    description: p.get("Description"),
    repo: p.get("Repo"),
    authorName: p.get("Author Name"),
    authorPfp: p.get("Author PFP"),
    image: p.get("Image"),
    featured: p.get("Featured") ?? false,
    category: p.get("Category") || "Other",
  })) as Project[];
}
