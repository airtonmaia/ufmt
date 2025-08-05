"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertTriangle, LogOut, MapPin, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { EmergencyContacts } from "@/components/emergency-contacts"
import { LocationTracker } from "@/components/location-tracker"
import { createAlert, addLocationUpdate, updateAlertStatus } from "@/lib/alerts"

interface UserData {
  id: number
  name: string
  studentId: string
  course: string
  email: string
  phone: string
}

export default function StudentApp() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isActivating, setIsActivating] = useState(false)
  const [isActivated, setIsActivated] = useState(false)
  const [progress, setProgress] = useState(0)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [currentAlertId, setCurrentAlertId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const progressRef = useRef<NodeJS.Timeout | null>(null)
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const userType = localStorage.getItem("userType")
    const storedUserData = localStorage.getItem("userData")

    if (userType !== "student" || !storedUserData) {
      router.push("/")
      return
    }

    const user = JSON.parse(storedUserData)
    setUserData(user)

    // Obter localização atual
    getCurrentLocation()
  }, [router])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Erro ao obter localização:", error)
          // Usar localização simulada (Campus da UFMT como exemplo)
          setLocation({
            lat: -15.5989 + (Math.random() - 0.5) * 0.01,
            lng: -56.0949 + (Math.random() - 0.5) * 0.01,
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
      )
    } else {
      // Fallback para localização simulada
      setLocation({
        lat: -15.5989 + (Math.random() - 0.5) * 0.01,
        lng: -56.0949 + (Math.random() - 0.5) * 0.01,
      })
    }
  }

  const handlePanicStart = () => {
    if (isActivated || isLoading) return

    setIsActivating(true)
    setProgress(0)

    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (progressRef.current) clearInterval(progressRef.current)
          activatePanic()
          return 100
        }
        // AJUSTE: Alterado de 15 (1.5s) para 20 (2s)
        return prev + 100 / 20 // 2 segundos = 20 intervalos de 100ms
      })
    }, 100)
  }

  const handlePanicEnd = () => {
    if (isActivated || isLoading) return

    setIsActivating(false)
    setProgress(0)
    if (progressRef.current) {
      clearInterval(progressRef.current)
    }
  }

  const activatePanic = async () => {
    if (!userData || !location) return

    setIsActivating(false)
    setIsLoading(true)

    try {
      const alert = await createAlert(
        userData.id,
        userData.studentId,
        userData.name,
        userData.course,
        location.lat,
        location.lng,
      )

      if (alert) {
        setIsActivated(true)
        setCurrentAlertId(alert.id)

        toast({
          title: "Alerta enviado!",
          description: "A equipe de segurança foi notificada via Supabase",
        })

        // Iniciar envio de localização em tempo real
        startLocationTracking(alert.id)
      } else {
        toast({
          title: "Erro ao enviar alerta",
          description: "Tente novamente",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível enviar o alerta",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const startLocationTracking = (alertId: number) => {
    locationIntervalRef.current = setInterval(async () => {
      getCurrentLocation()

      if (location) {
        try {
          await addLocationUpdate(alertId, location.lat, location.lng)
        } catch (error) {
          console.error("Erro ao atualizar localização:", error)
        }
      }
    }, 10000) // Atualizar a cada 10 segundos
  }

  const handleLogout = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (progressRef.current) clearInterval(progressRef.current)
    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current)

    localStorage.removeItem("userType")
    localStorage.removeItem("userData")
    router.push("/")
  }

  const resetAlert = async () => {
    if (currentAlertId) {
      try {
        await updateAlertStatus(currentAlertId, "false_alarm", userData?.id)
      } catch (error) {
        console.error("Erro ao cancelar alerta:", error)
      }
    }

    setIsActivated(false)
    setCurrentAlertId(null)
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current)
    }

    toast({
      title: "Alerta cancelado",
      description: "O alerta foi marcado como falso alarme",
    })
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (isActivated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        {currentAlertId && <LocationTracker alertId={currentAlertId} />}
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <AlertTriangle className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-green-800">Alerta Enviado!</h2>
            <p className="text-green-700 max-w-md">
              A equipe de segurança foi notificada via Supabase e está a caminho. Permaneça em segurança se possível.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-green-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">Localização sendo compartilhada em tempo real</span>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-green-600">ID do Alerta: #{currentAlertId}</p>
            <p className="text-xs text-green-500">Sua localização está sendo atualizada automaticamente via Supabase</p>
          </div>
          <Button
            onClick={resetAlert}
            variant="outline"
            className="mt-8 border-green-500 text-green-700 hover:bg-green-100 bg-transparent"
          >
            Cancelar Alerta
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="/diverse-student-profiles.png" />
            <AvatarFallback>
              {userData.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm text-gray-600">Olá, <span className="font-semibold text-gray-900">{userData.name}</span></p>
           <p className="text-xs text-gray-500">Curso: {userData.course}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-500 hover:text-gray-700">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-red-600">Em caso de emergência</h1>
            {/* AJUSTE: Texto atualizado para 2 segundos */}
            <p className="text-gray-700 max-w-md text-sm">
              Pressione e segure o botão por 2 segundos para alertar a equipe de segurança do campus.
            </p>
          </div>

          <div className="relative">
            <button
              onMouseDown={handlePanicStart}
              onMouseUp={handlePanicEnd}
              onTouchStart={handlePanicStart}
              onTouchEnd={handlePanicEnd}
              disabled={isLoading}
              className={`
                relative w-48 h-48 rounded-full text-white font-bold text-xl
                transition-all duration-200 transform active:scale-95
                ${isActivating ? "bg-red-700 shadow-2xl" : "bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl"}
                ${!isActivating && !isLoading && "animate-pulse"}
                ${isLoading && "opacity-50 cursor-not-allowed"}
              `}
              style={{
                boxShadow: isActivating
                  ? "0 0 0 4px rgba(239, 68, 68, 0.3), 0 0 30px rgba(239, 68, 68, 0.5)"
                  : undefined,
              }}
            >
              <div className="flex flex-col items-center justify-center h-full">
                {isLoading ? (
                  <Loader2 className="w-12 h-12 mb-2 animate-spin" />
                ) : (
                  <AlertTriangle className="w-12 h-12 mb-2" />
                )}
                <span>{isLoading ? "ENVIANDO..." : "PÂNICO"}</span>
              </div>

              {isActivating && (
                <div className="absolute inset-0 rounded-full">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="white"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                      className="transition-all duration-100 ease-linear"
                    />
                  </svg>
                </div>
              )}
            </button>
          </div>

          <div className="text-sm text-gray-700 space-y-2">
            {/* AJUSTE: Texto atualizado para 2 segundos */}
            <p>Mantenha pressionado por 2 segundos</p>
            {location && (
              <div className="flex items-center justify-center gap-1 text-green-600">
                <MapPin className="w-3 h-3" />
                <span>Localização ativa em tempo real</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <EmergencyContacts />
      </div>
    </div>
  )
}
