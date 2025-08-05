import { type NextRequest, NextResponse } from "next/server"
import { updateAlertStatus, getAlertById } from "@/lib/alerts"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const alertId = Number.parseInt(params.id)
    const { status, resolvedBy } = await request.json()

    if (!status) {
      return NextResponse.json({ error: "Status é obrigatório" }, { status: 400 })
    }

    const success = await updateAlertStatus(alertId, status, resolvedBy)

    if (!success) {
      return NextResponse.json({ error: "Erro ao atualizar alerta" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Erro ao atualizar alerta:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const alertId = Number.parseInt(params.id)
    const alert = await getAlertById(alertId)

    if (!alert) {
      return NextResponse.json({ error: "Alerta não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      alert,
    })
  } catch (error) {
    console.error("Erro ao buscar alerta:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
