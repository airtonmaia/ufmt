"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, X, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Notification {
  id: number
  alertId: number
  message: string
  type: "new_alert" | "status_change" | "system"
  timestamp: string
  read: boolean
}

export function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Simular notificações em tempo real
    const interval = setInterval(() => {
      // Em produção, isso seria substituído por WebSockets ou Server-Sent Events
      checkForNewNotifications()
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  const checkForNewNotifications = async () => {
    try {
      // Simular verificação de novos alertas
      const response = await fetch("/api/alerts/active")
      const data = await response.json()

      if (data.success && data.alerts.length > 0) {
        const newAlerts = data.alerts.filter((alert: any) => {
          const alertTime = new Date(alert.created_at).getTime()
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
          return alertTime > fiveMinutesAgo
        })

        newAlerts.forEach((alert: any) => {
          const notification: Notification = {
            id: Date.now() + Math.random(),
            alertId: alert.id,
            message: `Novo alerta de ${alert.student_name}`,
            type: "new_alert",
            timestamp: new Date().toISOString(),
            read: false,
          }

          setNotifications((prev) => [notification, ...prev.slice(0, 9)]) // Manter apenas 10 notificações
          setUnreadCount((prev) => prev + 1)

          // Mostrar toast
          toast({
            title: "🚨 Novo Alerta de Emergência",
            description: `${alert.student_name} acionou o botão de pânico`,
            variant: "destructive",
          })
        })
      }
    } catch (error) {
      console.error("Erro ao verificar notificações:", error)
    }
  }

  const markAsRead = (id: number) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
    setUnreadCount(0)
  }

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_alert":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "status_change":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Bell className="w-4 h-4 text-blue-500" />
    }
  }

  const formatTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Agora"
    if (diffMins < 60) return `${diffMins}min`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h`
    return time.toLocaleDateString()
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="relative">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-80 max-h-96 overflow-hidden shadow-lg z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Notificações</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                    Marcar todas como lidas
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-6 w-6">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">Nenhuma notificação</div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{notification.message}</p>
                        <p className="text-xs text-gray-500">{formatTime(notification.timestamp)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeNotification(notification.id)
                        }}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
