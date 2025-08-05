import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Funções de autenticação do Supabase
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Erro no login:", error)
    return { user: null, error: error.message }
  }

  return { user: data.user, error: null }
}

export async function signUpWithEmail(email: string, password: string, metadata: any) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })

  if (error) {
    console.error("Erro no cadastro:", error)
    return { user: null, error: error.message }
  }

  return { user: data.user, error: null }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Erro no logout:", error)
    return { error: error.message }
  }

  return { error: null }
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error("Erro ao obter usuário:", error)
    return null
  }

  return user
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

// Tipos TypeScript para o Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          email: string
          student_id: string | null
          name: string
          course: string | null
          phone: string | null
          user_type: "student" | "admin"
          password_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          email: string
          student_id?: string | null
          name: string
          course?: string | null
          phone?: string | null
          user_type: "student" | "admin"
          password_hash?: string | null
        }
        Update: {
          email?: string
          student_id?: string | null
          name?: string
          course?: string | null
          phone?: string | null
          user_type?: "student" | "admin"
          password_hash?: string | null
        }
      }
      alerts: {
        Row: {
          id: number
          user_id: number
          student_id: string
          student_name: string
          course: string | null
          latitude: number
          longitude: number
          status: "active" | "resolved" | "false_alarm" | "in_progress"
          created_at: string
          updated_at: string
          resolved_at: string | null
          resolved_by: number | null
        }
        Insert: {
          user_id: number
          student_id: string
          student_name: string
          course?: string | null
          latitude: number
          longitude: number
          status?: "active" | "resolved" | "false_alarm" | "in_progress"
        }
        Update: {
          status?: "active" | "resolved" | "false_alarm" | "in_progress"
          resolved_at?: string | null
          resolved_by?: number | null
          latitude?: number
          longitude?: number
        }
      }
      location_updates: {
        Row: {
          id: number
          alert_id: number
          latitude: number
          longitude: number
          created_at: string
        }
        Insert: {
          alert_id: number
          latitude: number
          longitude: number
        }
        Update: {
          latitude?: number
          longitude?: number
        }
      }
      notifications: {
        Row: {
          id: number
          alert_id: number | null
          message: string
          recipient_type: "admin" | "student" | "all"
          sent_at: string
          read_at: string | null
          status: "sent" | "delivered" | "failed"
        }
        Insert: {
          alert_id?: number | null
          message: string
          recipient_type: "admin" | "student" | "all"
          status?: "sent" | "delivered" | "failed"
        }
        Update: {
          read_at?: string | null
          status?: "sent" | "delivered" | "failed"
        }
      }
    }
  }
}

export type User = Database["public"]["Tables"]["users"]["Row"]
export type Alert = Database["public"]["Tables"]["alerts"]["Row"]
export type LocationUpdate = Database["public"]["Tables"]["location_updates"]["Row"]
export type Notification = Database["public"]["Tables"]["notifications"]["Row"]
