import { redirect } from "next/navigation";

export default async function LegacyPanelPage({ searchParams }: { searchParams: Promise<{ society?: string }> }) {
  const { society } = await searchParams;
  redirect(`/admin/members${society ? `?society=${encodeURIComponent(society)}` : ""}`);
}
