import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { ToastProvider } from "@/components/ui/toast"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <ToastProvider>
      <DashboardView user={session.user} />
    </ToastProvider>
  )
}