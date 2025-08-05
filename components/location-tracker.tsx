"use client"

import { useState, useEffect } from "react"
import { subscribeToLocationUpdates } from "@/lib/alerts" // Keep subscribeToLocationUpdates from alerts.ts
import { supabase } from "@/lib/supabase" // Import supabase client from supabase.ts
import type { LocationUpdate } from "@/lib/supabase"

interface LocationTrackerProps {
  alertId: number
  onLocationUpdate?: (location: LocationUpdate) => void
}

export function LocationTracker({ alertId, onLocationUpdate }: LocationTrackerProps) {
  const [locations, setLocations] = useState<LocationUpdate[]>([])

  useEffect(() => {
    const channel = subscribeToLocationUpdates(alertId, (payload) => {
      console.log("Nova atualização de localização:", payload)

      if (payload.eventType === "INSERT") {
        const newLocation = payload.new as LocationUpdate
        setLocations((prev) => [...prev, newLocation])
        onLocationUpdate?.(newLocation)
      }
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [alertId, onLocationUpdate])

  return null // Este componente não renderiza nada, apenas gerencia as subscriptions
}
