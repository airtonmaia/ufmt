"use client"

import { useEffect, useRef, useCallback } from "react"
import { subscribeToAlerts } from "@/lib/alerts"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import type { Alert } from "@/lib/supabase"

interface RealTimeAlertsProps {
  onNewAlert?: (alert: Alert) => void
  onAlertUpdate?: (alert: Alert) => void
  isSoundEnabled: boolean // Propriedade para controlar se o som deve tocar
}

export function RealTimeAlerts({ onNewAlert, onAlertUpdate, isSoundEnabled }: RealTimeAlertsProps) {
  const { toast } = useToast()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const channelRef = useRef<any>(null)

  // Estabiliza as funções para evitar reconfigurações
  const stableOnNewAlert = useCallback(onNewAlert || (() => {}), [])
  const stableOnAlertUpdate = useCallback(onAlertUpdate || (() => {}), [])
  const stableToast = useCallback(toast, [])

  // Inicializa o áudio uma vez
  useEffect(() => {
    if (!audioRef.current) {
      console.log("🎵 Inicializando elemento de áudio...")
      audioRef.current = new Audio("/alerta.mp3")
      audioRef.current.volume = 0.9
      
      // Adiciona listeners para debug
      audioRef.current.addEventListener('loadstart', () => console.log("🎵 Áudio: loadstart"))
      audioRef.current.addEventListener('canplay', () => console.log("🎵 Áudio: canplay"))
      audioRef.current.addEventListener('error', (e) => console.error("🎵 Áudio: error", e))
      
      console.log("🎵 Elemento de áudio inicializado:", audioRef.current)
    }
  }, [])

  // Configura a conexão do Supabase uma vez
  useEffect(() => {
    console.log("🔌 Configurando conexão Supabase...")
    
    channelRef.current = subscribeToAlerts((payload) => {
      console.log("Mudança em tempo real:", payload)

      if (payload.eventType === "INSERT") {
        const newAlert = payload.new as Alert

        stableToast({
          title: "🚨 Novo Alerta de Emergência",
          description: `${newAlert.student_name} acionou o botão de pânico`,
          variant: "destructive",
        })

        // Toca o som apenas se estiver habilitado
        console.log("🔊 Som habilitado:", isSoundEnabled, "Audio ref:", !!audioRef.current)
        if (isSoundEnabled && audioRef.current) {
          console.log("🎵 Tentando tocar som de alerta...")
          audioRef.current.play().then(() => {
            console.log("✅ Som tocado com sucesso!")
          }).catch((e) => {
            console.error("❌ Erro ao tocar som de alerta:", e)
            // Este erro pode ocorrer se o usuário não interagiu com o botão de som
            // ou se o navegador ainda está bloqueando por algum motivo.
            // O SoundToggle já tenta lidar com o desbloqueio inicial.
          })
        } else {
          console.log("🔇 Som não habilitado ou audio ref não disponível")
        }

        stableOnNewAlert(newAlert)
      } else if (payload.eventType === "UPDATE") {
        const updatedAlert = payload.new as Alert

        stableToast({
          title: "📋 Alerta Atualizado",
          description: `Status do alerta #${updatedAlert.id} foi alterado`,
        })

        stableOnAlertUpdate(updatedAlert)
      }
    })

    return () => {
      if (channelRef.current) {
        console.log("🔌 Removendo conexão Supabase...")
        supabase.removeChannel(channelRef.current)
      }
    }
  }, []) // Remove todas as dependências para evitar reconfiguração

  // Atualiza o estado do som sem reconfigurar a conexão
  useEffect(() => {
    console.log("🔊 Estado do som atualizado:", isSoundEnabled)
  }, [isSoundEnabled])

  return null // Este componente não renderiza nenhuma UI diretamente
}
