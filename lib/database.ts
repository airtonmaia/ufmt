import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const sql = neon(process.env.DATABASE_URL)

export { sql }

// Tipos TypeScript para o banco de dados
export interface User {
  id: number
  email: string
  student_id?: string
  name: string
  course?: string
  phone?: string
  user_type: "student" | "admin"
  password_hash?: string
  created_at: string
  updated_at: string
}

export interface Alert {
  id: number
  user_id: number
  student_id: string
  student_name: string
  course?: string
  latitude: number
  longitude: number
  status: "active" | "resolved" | "false_alarm" | "in_progress"
  created_at: string
  updated_at: string
  resolved_at?: string
  resolved_by?: number
}

export interface LocationUpdate {
  id: number
  alert_id: number
  latitude: number
  longitude: number
  created_at: string
}
