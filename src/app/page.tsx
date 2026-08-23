import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login");
  }
  redirect("/inventory");
}