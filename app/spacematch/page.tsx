import type { Metadata } from "next";
import { SpaceMatchStudio } from "@/components/spacematch/SpaceMatchStudio";

export const metadata: Metadata = { title: "SpaceMatch" };

export default async function SpaceMatchPage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string }>;
}) {
  const params = await searchParams;
  const prompt = params.prompt ?? "";
  return <SpaceMatchStudio key={prompt} initialPrompt={prompt} />;
}
