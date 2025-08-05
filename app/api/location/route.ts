import { type NextRequest, NextResponse } from "next/server"
import { addLocationUpdate } from "@/lib/alerts"

export async function POST(request: NextRequest) {
  try {
    const { alertId, latitude, longitude } = await request.json()

    if (!alertId || !latitude || !longitude) {
      return NextResponse.json({ error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    const success = await addLocationUpdate(alertId, latitude, longitude)

    if (!success) {
      return NextResponse.json({ error: "Erro ao atualizar localização" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Erro ao atualizar localização:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
