import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react"

interface ErrorRetryProps {
  error: string
  onRetry: () => void
  isRetrying?: boolean
  variant?: "default" | "connection" | "permission" | "server"
}

export function ErrorRetry({ 
  error, 
  onRetry, 
  isRetrying = false, 
  variant = "default" 
}: ErrorRetryProps) {
  const getErrorConfig = () => {
    switch (variant) {
      case "connection":
        return {
          icon: <WifiOff className="h-8 w-8 text-orange-500" />,
          title: "Connection Issue",
          description: "Unable to connect to calendar service. Please check your connection.",
          buttonText: "Retry Connection"
        }
      case "permission":
        return {
          icon: <AlertTriangle className="h-8 w-8 text-yellow-500" />,
          title: "Permission Required",
          description: "Calendar access is required to view your meetings.",
          buttonText: "Grant Permission"
        }
      case "server":
        return {
          icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
          title: "Server Error",
          description: "Something went wrong on our end. Please try again.",
          buttonText: "Try Again"
        }
      default:
        return {
          icon: <AlertTriangle className="h-8 w-8 text-muted-foreground" />,
          title: "Something went wrong",
          description: error || "An unexpected error occurred.",
          buttonText: "Try Again"
        }
    }
  }

  const config = getErrorConfig()

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {config.icon}
        </div>
        <CardTitle className="text-lg">{config.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground text-sm">
          {config.description}
        </p>
        <div className="space-y-2">
          <Button 
            onClick={onRetry} 
            disabled={isRetrying}
            className="w-full"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {config.buttonText}
              </>
            )}
          </Button>
        </div>
        {error && variant !== "default" && (
          <details className="text-xs text-left">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Technical details
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs whitespace-pre-wrap break-words">
              {error}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  )
}

export function ConnectionError({ onRetry, isRetrying }: { onRetry: () => void, isRetrying?: boolean }) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <ErrorRetry 
        error="No calendar connection found"
        onRetry={onRetry}
        isRetrying={isRetrying}
        variant="connection"
      />
    </div>
  )
}
