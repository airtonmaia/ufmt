import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Total de alertas
    const { count: totalAlerts } = await supabase.from("alerts").select("*", { count: "exact", head: true })

    // Alertas ativos
    const { count: activeAlerts } = await supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    // Alertas resolvidos hoje
    const today = new Date().toISOString().split("T")[0]
    const { count: resolvedToday } = await supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("status", "resolved")
      .gte("created_at", `${today}T00:00:00.000Z`)
      .lt("created_at", `${today}T23:59:59.999Z`)

    // Falsos alarmes hoje
    const { count: falseAlarmsToday } = await supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("status", "false_alarm")
      .gte("created_at", `${today}T00:00:00.000Z`)
      .lt("created_at", `${today}T23:59:59.999Z`)

    // Alertas por status
    const { data: alertsByStatus } = await supabase.from("alerts").select("status")

    const statusCounts =
      alertsByStatus?.reduce((acc: any, alert) => {
        acc[alert.status] = (acc[alert.status] || 0) + 1
        return acc
      }, {}) || {}

    const alertsByStatusFormatted = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }))

    // Alertas por hora nas últimas 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentAlerts } = await supabase
      .from("alerts")
      .select("created_at")
      .gte("created_at", twentyFourHoursAgo)

    const alertsByHour = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }))

    recentAlerts?.forEach((alert) => {
      const hour = new Date(alert.created_at).getHours()
      alertsByHour[hour].count++
    })

    // Tempo médio de resolução (simulado por enquanto)
    const avgResolutionTime = 15 // minutos

    return NextResponse.json({
      success: true,
      stats: {
        total: totalAlerts || 0,
        active: activeAlerts || 0,
        resolvedToday: resolvedToday || 0,
        falseAlarmsToday: falseAlarmsToday || 0,
        alertsByHour,
        alertsByStatus: alertsByStatusFormatted,
        avgResolutionTime,
      },
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
