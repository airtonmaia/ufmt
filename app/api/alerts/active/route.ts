import { NextResponse } from "next/server"
import { getActiveAlerts } from "@/lib/alerts"

export async function GET() {
  try {
    const alerts = await getActiveAlerts()

    return NextResponse.json({
      success: true,
      alerts,
    })
  } catch (error) {
    console.error("Erro ao buscar alertas ativos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
