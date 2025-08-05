"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertTriangle,
  MapPin,
  Clock,
  LogOut,
  Eye,
  CheckCircle,
  AlertCircle,
  Navigation,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { StatsDashboard } from "@/components/stats-dashboard"
import { RealTimeNotifications } from "@/components/real-time-notifications"
import { RealTimeAlerts } from "@/components/real-time-alerts"
import { SoundToggle } from "@/components/sound-toggle"
import { getAllAlerts, updateAlertStatus } from "@/lib/alerts"
import type { Alert } from "@/lib/supabase"

interface UserData {
  id: number
  name: string
  email: string
}

export default function AdminDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("soundEnabled") === "true"
    }
    return false
  }) // Estado para controle de som
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const userType = localStorage.getItem("userType")
    const storedUserData = localStorage.getItem("userData")

    if (userType !== "admin" || !storedUserData) {
      router.push("/")
      return
    }

    const user = JSON.parse(storedUserData)
    setUserData(user)

    // Carregar alertas iniciais
    loadAlerts()
  }, [router])

  // Debug do estado do som
  useEffect(() => {
    console.log("🔊 Estado do som no admin:", isSoundEnabled)
  }, [isSoundEnabled])

  const loadAlerts = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)

    try {
      const alertsData = await getAllAlerts()
      setAlerts(alertsData)

      // Se há um alerta selecionado, atualizá-lo
      if (selectedAlert) {
        const updatedAlert = alertsData.find((alert) => alert.id === selectedAlert.id)
        if (updatedAlert) {
          setSelectedAlert(updatedAlert)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar alertas:", error)
      toast({
        title: "Erro ao carregar alertas",
        description: "Não foi possível conectar ao servidor",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleUpdateAlertStatus = async (alertId: number, status: Alert["status"]) => {
    if (!userData) return

    try {
      const success = await updateAlertStatus(alertId, status, userData.id)

      if (success) {
        // Atualizar o estado local
        const updatedAlerts = alerts.map((alert) =>
          alert.id === alertId
            ? { ...alert, status, resolved_by: userData.id, resolved_at: new Date().toISOString() }
            : alert,
        )
        setAlerts(updatedAlerts)

        if (selectedAlert?.id === alertId) {
          setSelectedAlert({
            ...selectedAlert,
            status,
            resolved_by: userData.id,
            resolved_at: new Date().toISOString(),
          })
        }

        toast({
          title: "Status atualizado",
          description: `Alerta marcado como ${getStatusText(status).toLowerCase()}`,
        })
      } else {
        toast({
          title: "Erro ao atualizar status",
          description: "Tente novamente",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      })
    }
  }

  const handleNewAlert = useCallback((newAlert: Alert) => {
    setAlerts((prev) => [newAlert, ...prev])
  }, [])

  const handleAlertUpdate = useCallback((updatedAlert: Alert) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === updatedAlert.id ? updatedAlert : alert)))

    if (selectedAlert?.id === updatedAlert.id) {
      setSelectedAlert(updatedAlert)
    }
  }, [selectedAlert?.id])

  const getStatusColor = (status: Alert["status"]) => {
    switch (status) {
      case "active":
        return "bg-red-500"
      case "in_progress":
        return "bg-yellow-500"
      case "resolved":
        return "bg-green-500"
      case "false_alarm":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: Alert["status"]) => {
    switch (status) {
      case "active":
        return "Ativo"
      case "in_progress":
        return "Em Andamento"
      case "resolved":
        return "Resolvido"
      case "false_alarm":
        return "Falso Alarme"
      default:
        return "Desconhecido"
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("pt-BR")
  }

  const getTimeSince = (timestamp: string) => {
    const now = new Date()
    const alertTime = new Date(timestamp)
    const diffMs = now.getTime() - alertTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Agora mesmo"
    if (diffMins < 60) return `${diffMins} min atrás`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h atrás`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d atrás`
  }

  const handleLogout = () => {
    localStorage.removeItem("userType")
    localStorage.removeItem("userData")
    router.push("/")
  }

  const activeAlerts = alerts.filter((alert) => alert.status === "active")

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Componente para escutar mudanças em tempo real */}
      <RealTimeAlerts onNewAlert={handleNewAlert} onAlertUpdate={handleAlertUpdate} isSoundEnabled={isSoundEnabled} />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard de Segurança</h1>
                <p className="text-sm text-gray-600">Supabase Real-time - {userData?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => loadAlerts(true)} disabled={isRefreshing}>
                {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  console.log("🧪 Testando som...")
                  const audio = new Audio("/alerta.mp3")
                  audio.volume = 0.9
                  audio.play().then(() => console.log("✅ Teste de som OK")).catch(e => console.error("❌ Erro no teste:", e))
                }}
              >
                🧪 Teste Som
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  console.log("🧪 Simulando novo alerta...")
                  // Simula um novo alerta para testar se o som toca
                  const mockAlert = {
                    id: 999,
                    student_name: "Teste",
                    student_id: "TEST123",
                    course: "Teste",
                    latitude: -23.5505,
                    longitude: -46.6333,
                    status: "active" as const,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    user_id: 1,
                    resolved_by: null,
                    resolved_at: null
                  }
                  handleNewAlert(mockAlert)
                }}
              >
                🧪 Simular Alerta
              </Button>
              <SoundToggle onToggle={setIsSoundEnabled} /> {/* Novo botão de alternância de som */}
              <RealTimeNotifications />
              <Badge variant={activeAlerts.length > 0 ? "destructive" : "secondary"}>
                {activeAlerts.length} alertas ativos
              </Badge>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
       

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mapa Simulado */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Mapa do Campus - Tempo Real
                </CardTitle>
                <CardDescription>Localização dos alertas ativos com atualizações automáticas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative bg-green-100 rounded-lg h-96 overflow-hidden">
                  {/* Simulação de mapa */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-200 to-green-300">
                    <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-sm font-medium">
                      Campus Universitário - Supabase Real-time
                    </div>

                    {/* Pontos dos alertas ativos */}
                    {activeAlerts.map((alert, index) => {
                      // Converter coordenadas reais para posição no mapa simulado
                      const mapX = 30 + (alert.longitude + 46.6333) * 1000 + index * 15
                      const mapY = 40 + (alert.latitude + 23.5505) * 1000 + index * 10

                      return (
                        <div
                          key={alert.id}
                          className="absolute animate-pulse cursor-pointer"
                          style={{
                            left: `${Math.max(10, Math.min(80, mapX))}%`,
                            top: `${Math.max(10, Math.min(80, mapY))}%`,
                          }}
                          onClick={() => setSelectedAlert(alert)}
                        >
                          <div className="relative">
                            <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                              <AlertTriangle className="w-3 h-3 text-white" />
                            </div>
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              {alert.student_name}
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Pontos de referência */}
                    <div className="absolute bottom-6 right-6 bg-blue-500 w-4 h-4 rounded-full border-2 border-white"></div>
                    <div className="absolute bottom-2 right-2 text-xs text-gray-600">Biblioteca</div>

                    <div className="absolute top-1/3 right-1/4 bg-yellow-500 w-4 h-4 rounded-full border-2 border-white"></div>
                    <div className="absolute top-1/3 right-1/4 transform translate-y-6 text-xs text-gray-600">
                      Cantina
                    </div>

                    <div className="absolute top-1/2 left-1/4 bg-purple-500 w-4 h-4 rounded-full border-2 border-white"></div>
                    <div className="absolute top-1/2 left-1/4 transform translate-y-6 text-xs text-gray-600">
                      Laboratórios
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Alertas */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Alertas Recentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum alerta registrado</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedAlert?.id === alert.id ? "bg-blue-50 border-blue-200" : "bg-white hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src="/diverse-students-studying.png" />
                          <AvatarFallback>
                            {alert.student_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{alert.student_name}</p>
                            <Badge variant="secondary" className={`${getStatusColor(alert.status)} text-white text-xs`}>
                              {getStatusText(alert.status)}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{alert.course || "Curso não informado"}</p>
                          <p className="text-xs text-gray-500 mb-1">ID: {alert.student_id}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getTimeSince(alert.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Navigation className="w-3 h-3" />
                              GPS
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Detalhes do Alerta Selecionado */}
            {selectedAlert && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Detalhes do Alerta #{selectedAlert.id}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src="/diverse-student-profiles.png" />
                      <AvatarFallback>
                        {selectedAlert.student_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedAlert.student_name}</p>
                      <p className="text-sm text-gray-600">{selectedAlert.course || "Curso não informado"}</p>
                      <p className="text-sm text-gray-600">ID: {selectedAlert.student_id}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>Acionado em: {formatTime(selectedAlert.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>
                        Localização: {selectedAlert.latitude.toFixed(6)}, {selectedAlert.longitude.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Navigation className="w-4 h-4 text-blue-500" />
                      <span>Última atualização: {formatTime(selectedAlert.updated_at)}</span>
                    </div>
                    {selectedAlert.resolved_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Resolvido em: {formatTime(selectedAlert.resolved_at)}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Ações:</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateAlertStatus(selectedAlert.id, "in_progress")}
                        className="bg-yellow-600 hover:bg-yellow-700"
                        disabled={selectedAlert.status === "in_progress"}
                      >
                        Em Andamento
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateAlertStatus(selectedAlert.id, "resolved")}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={selectedAlert.status === "resolved"}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateAlertStatus(selectedAlert.id, "false_alarm")}
                        disabled={selectedAlert.status === "false_alarm"}
                      >
                        Falso Alarme
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
         {/* Statistics Dashboard */}
         <div className="mt-6">
          <StatsDashboard />
        </div>
      </div>
    </div>
  )
}
