"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Users, Loader2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [studentId, setStudentId] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const router = useRouter()
  const { toast } = useToast()

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setDebugInfo("Iniciando login de estudante...")

    try {
      console.log("Frontend: Tentando login de estudante:", studentId)

      const response = await fetch("/api/auth/student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentId }),
      })

      console.log("Frontend: Resposta da API:", response.status)

      const data = await response.json()
      console.log("Frontend: Dados da resposta:", data)

      setDebugInfo(`Status: ${response.status}, Success: ${data.success}`)

      if (data.success) {
        // Salvar dados do usuário no localStorage
        localStorage.setItem("userType", "student")
        localStorage.setItem("userData", JSON.stringify(data.user))

        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${data.user.name}`,
        })

        console.log("Frontend: Redirecionando para /student")
        router.push("/student")
      } else {
        toast({
          title: "Erro no login",
          description: data.error || "Estudante não encontrado",
          variant: "destructive",
        })
        setDebugInfo(`Erro: ${data.error}`)
      }
    } catch (error) {
      console.error("Frontend: Erro na requisição:", error)
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor",
        variant: "destructive",
      })
      setDebugInfo(`Erro de conexão: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setDebugInfo("Iniciando login de admin...")

    try {
      console.log("Frontend: Tentando login de admin:", adminEmail)

      const response = await fetch("/api/auth/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      })

      console.log("Frontend: Resposta da API:", response.status)

      const data = await response.json()
      console.log("Frontend: Dados da resposta:", data)

      setDebugInfo(`Status: ${response.status}, Success: ${data.success}`)

      if (data.success) {
        // Salvar dados do usuário no localStorage
        localStorage.setItem("userType", "admin")
        localStorage.setItem("userData", JSON.stringify(data.user))

        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${data.user.name}`,
        })

        console.log("Frontend: Redirecionando para /admin")
        router.push("/admin")
      } else {
        toast({
          title: "Erro no login",
          description: data.error || "Credenciais inválidas",
          variant: "destructive",
        })
        setDebugInfo(`Erro: ${data.error}`)
      }
    } catch (error) {
      console.error("Frontend: Erro na requisição:", error)
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor",
        variant: "destructive",
      })
      setDebugInfo(`Erro de conexão: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto rounded-full flex items-center justify-center mb-4">
           <img src="/logo.png" className="w-80" alt="" />
          </div>
          <p className="text-blue-800 mt-2">Sistema de Segurança Universitária</p>
          <p className="text-xs text-blue-800 mt-2">Versão de prévia 1.0.0</p>
        </div>

      

        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student">Estudante</TabsTrigger>
            <TabsTrigger value="admin">Administração</TabsTrigger>
          </TabsList>

          <TabsContent value="student">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Acesso do Estudante
                </CardTitle>
                <CardDescription>Entre com seu número de matrícula</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Número de Matrícula</Label>
                    <Input
                      id="studentId"
                      type="text"
                      placeholder="Ex: 2024001234"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>
                <div className="mt-4 text-sm text-gray-600">
                  <p className="font-medium mb-2">Contas de teste:</p>
                  <p>2024001234 - <b>João Silva Santos</b></p>
                  <p>2024001235 - <b>Maria Oliveira Costa</b></p>
                  <p>2024001236 - <b>Airton Maia</b></p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Painel Administrativo
                </CardTitle>
                <CardDescription>Acesso para equipe de segurança</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="admin@universidade.edu.br"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Senha</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar no Dashboard"
                    )}
                  </Button>
                </form>
                <div className="mt-4 text-sm text-gray-600">
                  <p className="font-medium mb-2">Contas de teste:</p>
                  <p>admin@universidade.edu.br</p>
                  <p>seguranca@universidade.edu.br</p>
                  <p className="text-xs mt-3 text-green-600">Qualquer senha funciona para demonstração</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
