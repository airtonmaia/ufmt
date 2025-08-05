import { type NextRequest, NextResponse } from "next/server"
import { authenticateStudent } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("API: Recebendo requisição de login de estudante")

    const body = await request.json()
    console.log("API: Body da requisição:", body)

    const { studentId } = body

    if (!studentId) {
      console.log("API: Student ID não fornecido")
      return NextResponse.json({ error: "Número de matrícula é obrigatório" }, { status: 400 })
    }

    console.log("API: Tentando autenticar estudante:", studentId)
    const { user, error } = await authenticateStudent(studentId)

    console.log("API: Resultado da autenticação:", { user: !!user, error })

    if (error || !user) {
      return NextResponse.json({ error: error || "Estudante não encontrado" }, { status: 401 })
    }

    const responseData = {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        studentId: user.student_id,
        course: user.course,
        email: user.email,
        phone: user.phone,
      },
    }

    console.log("API: Enviando resposta de sucesso:", responseData)
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("API: Erro na autenticação:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
