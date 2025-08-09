import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardView } from "@/components/dashboard/dashboard-view"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return <DashboardView user={session.user} />
}