import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
  variant?: "default" | "card" | "text" | "avatar"
}

export function LoadingSkeleton({ className, variant = "default" }: LoadingSkeletonProps) {
  const baseClasses = "animate-pulse bg-muted rounded"
  
  const variantClasses = {
    default: "h-4 w-full",
    card: "h-48 w-full",
    text: "h-3 w-3/4",
    avatar: "h-10 w-10 rounded-full",
  }

  return (
    <div 
      className={cn(baseClasses, variantClasses[variant], className)} 
      aria-label="Loading..."
    />
  )
}

export function MeetingCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <LoadingSkeleton className="h-6 w-3/4" />
      <div className="space-y-2">
        <LoadingSkeleton className="h-4 w-full" />
        <LoadingSkeleton className="h-4 w-2/3" />
        <LoadingSkeleton className="h-4 w-1/2" />
      </div>
      <LoadingSkeleton className="h-8 w-full" />
    </div>
  )
}

export function MeetingListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      <LoadingSkeleton className="h-8 w-48" />
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <MeetingCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
