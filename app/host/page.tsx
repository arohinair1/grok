import type { Metadata } from "next";
import { HostStudio } from "@/components/host/HostStudio";

export const metadata: Metadata = { title: "List Your Space" };

export default function HostPage() {
  return <HostStudio />;
}
