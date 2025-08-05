"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Clock } from "lucide-react"

interface Stats {
  total: number
  active: number
  resolvedToday: number
  falseAlarmsToday: number
  alertsByHour: Array<{ hour: number; count: number }>
  alertsByStatus: Array<{ status: string; count: number }>
  avgResolutionTime: number
}

export function StatsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 30000) // Atualizar a cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch("/api/alerts/stats")
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Desde o início</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <div className="h-4 w-4 bg-red-500 rounded-full animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Requer atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos Hoje</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolvedToday}</div>
            <p className="text-xs text-muted-foreground">Últimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.avgResolutionTime)}min</div>
            <p className="text-xs text-muted-foreground">Para resolução</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Alertas por Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Alertas por Status</CardTitle>
            <CardDescription>Distribuição atual dos alertas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.alertsByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={`
                      ${item.status === "active" ? "bg-red-500 text-white" : ""}
                      ${item.status === "resolved" ? "bg-green-500 text-white" : ""}
                      ${item.status === "false_alarm" ? "bg-gray-500 text-white" : ""}
                      ${item.status === "in_progress" ? "bg-yellow-500 text-white" : ""}
                    `}
                  >
                    {item.status === "active" && "Ativo"}
                    {item.status === "resolved" && "Resolvido"}
                    {item.status === "false_alarm" && "Falso Alarme"}
                    {item.status === "in_progress" && "Em Andamento"}
                  </Badge>
                </div>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade nas Últimas 24h</CardTitle>
            <CardDescription>Alertas por hora do dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.alertsByHour.map((item) => (
                <div key={item.hour} className="flex items-center gap-2">
                  <span className="text-sm w-8">{String(item.hour).padStart(2, "0")}h</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(5, (item.count / Math.max(...stats.alertsByHour.map((h) => h.count))) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm w-6">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
