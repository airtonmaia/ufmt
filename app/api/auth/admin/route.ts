import { type NextRequest, NextResponse } from "next/server"
import { authenticateAdmin } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("API: Recebendo requisição de login de admin")

    const body = await request.json()
    console.log("API: Body da requisição:", body)

    const { email, password } = body

    if (!email || !password) {
      console.log("API: Email ou senha não fornecidos")
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    console.log("API: Tentando autenticar admin:", email)
    const { user, error } = await authenticateAdmin(email, password)

    console.log("API: Resultado da autenticação:", { user: !!user, error })

    if (error || !user) {
      return NextResponse.json({ error: error || "Credenciais inválidas" }, { status: 401 })
    }

    const responseData = {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    }

    console.log("API: Enviando resposta de sucesso:", responseData)
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("API: Erro na autenticação:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
