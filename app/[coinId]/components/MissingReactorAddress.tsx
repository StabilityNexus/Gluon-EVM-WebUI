import { AlertTriangle } from "lucide-react"

export function MissingReactorAddress() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Reactor Address</h2>
        <p className="text-muted-foreground">
          Please provide a valid reactor address.
        </p>
      </div>
    </div>
  )
}
