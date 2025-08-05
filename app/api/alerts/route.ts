import { type NextRequest, NextResponse } from "next/server"
import { createAlert, getAllAlerts } from "@/lib/alerts"

export async function POST(request: NextRequest) {
  try {
    const { userId, studentId, studentName, course, latitude, longitude } = await request.json()

    if (!userId || !studentId || !studentName || !latitude || !longitude) {
      return NextResponse.json({ error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    const alert = await createAlert(userId, studentId, studentName, course || "", latitude, longitude)

    if (!alert) {
      return NextResponse.json({ error: "Erro ao criar alerta" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      alert,
    })
  } catch (error) {
    console.error("Erro ao criar alerta:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const alerts = await getAllAlerts()

    return NextResponse.json({
      success: true,
      alerts,
    })
  } catch (error) {
    console.error("Erro ao buscar alertas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
