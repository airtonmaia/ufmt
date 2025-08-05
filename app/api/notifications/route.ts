import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase" // Importar o cliente Supabase

export async function POST(request: NextRequest) {
  try {
    const { alertId, message, recipientType } = await request.json()

    if (!message || !recipientType) {
      return NextResponse.json({ error: "Mensagem e tipo de destinatário são obrigatórios" }, { status: 400 })
    }

    // Inserir notificação no banco de dados Supabase
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        alert_id: alertId, // Pode ser null se for uma notificação geral
        message: message,
        recipient_type: recipientType,
        status: "sent",
      })
      .select()
      .single() // Retorna o item inserido

    if (error) {
      console.error("Erro ao enviar notificação para o Supabase:", error)
      return NextResponse.json({ error: "Erro ao enviar notificação" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      notification: data,
    })
  } catch (error) {
    console.error("Erro ao processar requisição de notificação:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
