"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { VolumeX, Volume2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SoundToggleProps {
  isSoundEnabled: boolean;
  setIsSoundEnabled: (isEnabled: boolean) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export function SoundToggle({ isSoundEnabled, setIsSoundEnabled, audioRef }: SoundToggleProps) {
  const { toast } = useToast()

  // Sincroniza o estado com o localStorage sempre que ele mudar
  useEffect(() => {
    localStorage.setItem("soundEnabled", String(isSoundEnabled))
  }, [isSoundEnabled]);

  const handleToggleSound = async () => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);

    if (newState) {
      if (audioRef.current) {
        try {
          // Tenta tocar o áudio. A primeira vez após um clique do usuário
          // deve "desbloquear" a permissão de autoplay do navegador.
          await audioRef.current.play();
          audioRef.current.pause(); // Pausa imediatamente, pois é só para ativar
          audioRef.current.currentTime = 0;

          toast({
            title: "Som de Alerta Habilitado",
            description: "Você receberá alertas sonoros para novas emergências.",
          });
        } catch (e) {
          console.error("Erro ao tentar habilitar som:", e);
          setIsSoundEnabled(false); // Reverte o estado se a reprodução falhar
          toast({
            title: "Não foi possível habilitar o som",
            description: "Seu navegador pode estar bloqueando a reprodução. Interaja com a página e tente novamente.",
            variant: "destructive",
          });
        }
      }
    } else {
      toast({
        title: "Som de Alerta Desabilitado",
        description: "Os alertas sonoros estão desativados.",
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggleSound}
      title={isSoundEnabled ? "Desabilitar som de alerta" : "Habilitar som de alerta"}
    >
      {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      <span className="sr-only">{isSoundEnabled ? "Desabilitar som de alerta" : "Habilitar som de alerta"}</span>
    </Button>
  );
}
