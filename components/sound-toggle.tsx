"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { VolumeX, Volume2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SoundToggleProps {
  onToggle: (isEnabled: boolean) => void
}

export function SoundToggle({ onToggle }: SoundToggleProps) {
  // Inicializa o estado lendo do localStorage ou como false por padrão
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("soundEnabled") === "true"
    }
    return false
  })
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Inicializa o elemento de áudio uma única vez
    if (!audioRef.current) {
      console.log("🎵 SoundToggle: Inicializando áudio...")
      audioRef.current = new Audio("/alerta.mp3")
      audioRef.current.volume = 0.9 // Volume padrão para reprodução real
    }

    // Notifica o componente pai sobre o estado inicial
    console.log("🎵 SoundToggle: Estado inicial do som:", isSoundEnabled)
    onToggle(isSoundEnabled)
  }, [onToggle, isSoundEnabled]) // Adicionado isSoundEnabled para re-executar se o estado inicial mudar

  const handleToggleSound = async () => {
    console.log("🎵 SoundToggle: Botão clicado, estado atual:", isSoundEnabled)
    const newState = !isSoundEnabled
    console.log("🎵 SoundToggle: Novo estado será:", newState)
    
    setIsSoundEnabled(newState)
    localStorage.setItem("soundEnabled", String(newState)) // Persiste no localStorage
    onToggle(newState) // Notifica o componente pai

    if (newState) {
      console.log("🎵 SoundToggle: Habilitando som...")
      // Tenta reproduzir um som mudo para "desbloquear" o autoplay
      if (audioRef.current) {
        try {
          console.log("🎵 SoundToggle: Tentando reproduzir som de teste...")
          // Temporariamente define o volume para 0 para a primeira reprodução silenciosa
          const originalVolume = audioRef.current.volume
          audioRef.current.volume = 0.01 // Um volume mínimo para ser considerado "som" mas quase inaudível
          await audioRef.current.play()
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          audioRef.current.volume = originalVolume // Restaura o volume original
          console.log("🎵 SoundToggle: Som de teste reproduzido com sucesso!")

          toast({
            title: "Som de Alerta Habilitado",
            description: "Você receberá alertas sonoros para novas emergências.",
          })
        } catch (e: any) {
          console.error("❌ SoundToggle: Erro ao tentar habilitar som:", e)
          setIsSoundEnabled(false) // Reverte o estado se a reprodução falhar
          localStorage.setItem("soundEnabled", "false")
          onToggle(false)
          toast({
            title: "Não foi possível habilitar o som",
            description:
              "Seu navegador pode estar bloqueando a reprodução automática. Por favor, clique em qualquer lugar da página e tente novamente.",
            variant: "destructive",
          })
        }
      } else {
        console.error("❌ SoundToggle: Audio ref não disponível!")
      }
    } else {
      console.log("🎵 SoundToggle: Desabilitando som...")
      toast({
        title: "Som de Alerta Desabilitado",
        description: "Os alertas sonoros estão desativados.",
      })
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggleSound}
      className="relative"
      title={isSoundEnabled ? "Desabilitar som de alerta" : "Habilitar som de alerta"}
    >
      {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      <span className="sr-only">{isSoundEnabled ? "Desabilitar som de alerta" : "Habilitar som de alerta"}</span>
    </Button>
  )
}
