import { supabase } from "./supabase"
import type { Alert, LocationUpdate } from "./supabase"

export async function createAlert(
  userId: number,
  studentId: string,
  studentName: string,
  course: string,
  latitude: number,
  longitude: number,
): Promise<Alert | null> {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .insert({
        user_id: userId,
        student_id: studentId,
        student_name: studentName,
        course: course,
        latitude: latitude,
        longitude: longitude,
        status: "active",
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar alerta:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Erro ao criar alerta:", error)
    return null
  }
}

export async function getActiveAlerts(): Promise<Alert[]> {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar alertas ativos:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Erro ao buscar alertas ativos:", error)
    return []
  }
}

export async function getAllAlerts(limit = 50): Promise<Alert[]> {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Erro ao buscar todos os alertas:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Erro ao buscar todos os alertas:", error)
    return []
  }
}

export async function updateAlertStatus(
  alertId: number,
  status: Alert["status"],
  resolvedBy?: number,
): Promise<boolean> {
  try {
    const updateData: any = {
      status: status,
      resolved_by: resolvedBy,
    }

    if (status === "resolved") {
      updateData.resolved_at = new Date().toISOString()
    }

    const { error } = await supabase.from("alerts").update(updateData).eq("id", alertId)

    if (error) {
      console.error("Erro ao atualizar status do alerta:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao atualizar status do alerta:", error)
    return false
  }
}

export async function addLocationUpdate(alertId: number, latitude: number, longitude: number): Promise<boolean> {
  try {
    // Inserir nova atualização de localização
    const { error: locationError } = await supabase.from("location_updates").insert({
      alert_id: alertId,
      latitude: latitude,
      longitude: longitude,
    })

    if (locationError) {
      console.error("Erro ao adicionar atualização de localização:", locationError)
      return false
    }

    // Atualizar também a localização principal do alerta
    const { error: alertError } = await supabase
      .from("alerts")
      .update({
        latitude: latitude,
        longitude: longitude,
      })
      .eq("id", alertId)

    if (alertError) {
      console.error("Erro ao atualizar localização do alerta:", alertError)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao adicionar atualização de localização:", error)
    return false
  }
}

export async function getLocationHistory(alertId: number): Promise<LocationUpdate[]> {
  try {
    const { data, error } = await supabase
      .from("location_updates")
      .select("*")
      .eq("alert_id", alertId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Erro ao buscar histórico de localização:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Erro ao buscar histórico de localização:", error)
    return []
  }
}

export async function getAlertById(alertId: number): Promise<Alert | null> {
  try {
    const { data, error } = await supabase.from("alerts").select("*").eq("id", alertId).single()

    if (error) {
      console.error("Erro ao buscar alerta:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Erro ao buscar alerta:", error)
    return null
  }
}

// Função para escutar mudanças em tempo real
export function subscribeToAlerts(callback: (payload: any) => void) {
  return supabase
    .channel("alerts")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "alerts",
      },
      callback,
    )
    .subscribe()
}

// Função para escutar mudanças nas atualizações de localização
export function subscribeToLocationUpdates(alertId: number, callback: (payload: any) => void) {
  return supabase
    .channel(`location_updates_${alertId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "location_updates",
        filter: `alert_id=eq.${alertId}`,
      },
      callback,
    )
    .subscribe()
}
