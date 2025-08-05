import { supabase } from "./supabase"
import type { User } from "./supabase"

export async function authenticateStudent(studentId: string): Promise<{ user: User | null; error: string | null }> {
  try {
    console.log("Tentando autenticar estudante:", studentId)

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("student_id", studentId)
      .eq("user_type", "student")
      .single()

    console.log("Resultado da consulta:", { userData, userError })

    if (userError) {
      console.error("Erro na consulta:", userError)
      return { user: null, error: "Estudante não encontrado" }
    }

    if (!userData) {
      return { user: null, error: "Estudante não encontrado" }
    }

    return { user: userData, error: null }
  } catch (error) {
    console.error("Erro na autenticação do estudante:", error)
    return { user: null, error: "Erro interno do servidor" }
  }
}

export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<{ user: User | null; error: string | null }> {
  try {
    console.log("Tentando autenticar admin:", email)

    // Por enquanto, vamos usar autenticação simples sem Supabase Auth
    // Verificar se o usuário existe na tabela users
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("user_type", "admin")
      .single()

    console.log("Resultado da consulta admin:", { userData, userError })

    if (userError) {
      console.error("Erro na consulta admin:", userError)
      return { user: null, error: "Administrador não encontrado" }
    }

    if (!userData) {
      return { user: null, error: "Administrador não encontrado" }
    }

    // Para demonstração, aceitar qualquer senha para admins cadastrados
    // Em produção, você deveria verificar o hash da senha
    return { user: userData, error: null }
  } catch (error) {
    console.error("Erro na autenticação do admin:", error)
    return { user: null, error: "Erro interno do servidor" }
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

    if (error) {
      console.error("Erro ao buscar usuário:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Erro ao buscar usuário:", error)
    return null
  }
}
