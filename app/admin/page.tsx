"use client"


import { useState, useEffect, useCallback, useRef } from "react"
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
  Volume2,
  VolumeX
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { StatsDashboard } from "@/components/stats-dashboard"
import { RealTimeNotifications } from "@/components/real-time-notifications"
import { getAllAlerts, updateAlertStatus, subscribeToAlerts, supabase } from "@/lib/alerts"
import type { Alert } from "@/lib/supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"

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
  const [isSoundEnabled, setIsSoundEnabled] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- LÓGICA CENTRALIZADA E CORRIGIDA ---

  // Efeito 1: Executado uma vez para inicializar o áudio, verificar o utilizador e carregar os dados iniciais.
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio('/alerta.mp3');
      audioRef.current.volume = 0.9;
      setIsSoundEnabled(localStorage.getItem('soundEnabled') === 'true');
    }

    const userType = localStorage.getItem("userType");
    const storedUserData = localStorage.getItem("userData");
    if (userType !== "admin" || !storedUserData) {
      router.push("/");
      return;
    }
    setUserData(JSON.parse(storedUserData));
    
    loadAlerts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array VAZIO garante que isto só é executado UMA VEZ.

  const handleNewAlert = useCallback((newAlert: Alert) => {
    setAlerts(prevAlerts => {
      if (prevAlerts.some(a => a.id === newAlert.id)) {
        console.log(`[RealTime] Alerta duplicado #${newAlert.id} ignorado.`);
        return prevAlerts;
      }
      return [newAlert, ...prevAlerts];
    });
  }, []);

  const handleAlertUpdate = useCallback((updatedAlert: Alert) => {
    setAlerts(prev => prev.map(a => a.id === updatedAlert.id ? updatedAlert : a));
    setSelectedAlert(prev => prev?.id === updatedAlert.id ? updatedAlert : prev);
  }, []);

  // Efeito 2: Dedicado EXCLUSIVAMENTE à subscrição em tempo real.
  useEffect(() => {
    const handlePayload = (payload: any) => {
      if (payload.eventType === 'INSERT') {
        const newAlert = payload.new as Alert;
        handleNewAlert(newAlert);
        toast({
          title: "🚨 Novo Alerta de Emergência",
          description: `${newAlert.student_name} acionou o pânico`,
          variant: "destructive",
        });
        if (localStorage.getItem('soundEnabled') === 'true' && audioRef.current) {
            audioRef.current.play().catch(e => console.error("Erro ao tocar som:", e));
        }
      } else if (payload.eventType === 'UPDATE') {
        const updatedAlert = payload.new as Alert;
        handleAlertUpdate(updatedAlert);
      }
    };
    
    console.log("🔌 A subscrever ao canal de alertas...");
    const channel = subscribeToAlerts(handlePayload);
    channel.subscribe((status, err) => {
        console.log(`[Supabase Realtime] Status: ${status}`);
        if (err) console.error("Erro de subscrição:", err);
    });

    // Função de Limpeza
    return () => {
      console.log("🔌 A remover subscrição do canal...");
      supabase.removeChannel(channel);
    };
  }, [handleNewAlert, handleAlertUpdate, toast]); // Dependências estáveis

  const toggleSound = async () => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    localStorage.setItem('soundEnabled', String(newState));
    if (newState && audioRef.current) {
      try {
        audioRef.current.volume = 0;
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.9;
        toast({ title: "Som de Alerta Habilitado" });
      } catch (error) {
        toast({ title: "Erro ao habilitar som", variant: "destructive" });
      }
    } else {
        toast({ title: "Som de Alerta Desabilitado" });
    }
  };

  const loadAlerts = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const alertsData = await getAllAlerts();
      setAlerts(alertsData);
    } catch (error) {
      console.error("Erro ao carregar alertas:", error);
      toast({ title: "Erro ao carregar alertas", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  const handleUpdateAlertStatus = async (alertId: number, status: Alert["status"]) => {
    if (!userData) return;
    try {
      await updateAlertStatus(alertId, status, userData.id);
      toast({
        title: "Status atualizado",
        description: `Ação registada. A lista será atualizada em breve.`,
      });
    } catch (error) {
      toast({ title: "Erro de conexão", variant: "destructive" });
    }
  };

  const getStatusColor = (status: Alert["status"]) => {
    switch (status) {
      case "active": return "bg-red-500";
      case "in_progress": return "bg-yellow-500";
      case "resolved": return "bg-green-500";
      case "false_alarm": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: Alert["status"]) => {
    switch (status) {
      case "active": return "Ativo";
      case "in_progress": return "Em Andamento";
      case "resolved": return "Resolvido";
      case "false_alarm": return "Falso Alarme";
      default: return "Desconhecido";
    }
  };

  const formatTime = (timestamp: string) => new Date(timestamp).toLocaleString("pt-BR");

  const getTimeSince = (timestamp: string) => {
    const diffMins = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 60000);
    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `${diffMins} min atrás`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${Math.floor(diffHours / 24)}d atrás`;
  };

  const handleLogout = () => {
    localStorage.removeItem("userType");
    localStorage.removeItem("userData");
    router.push("/");
  };

  const activeAlerts = alerts.filter((alert) => alert.status === "active");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <Button variant="ghost" size="icon" onClick={toggleSound} title={isSoundEnabled ? "Desabilitar som de alerta" : "Habilitar som de alerta"}>
                {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
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
          <div className="lg:col-span-2">
             <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" />Mapa do Campus - Tempo Real</CardTitle>
                <CardDescription>Localização dos alertas ativos com atualizações automáticas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative bg-green-100 rounded-lg h-96 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-200 to-green-300">
                    <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-sm font-medium">Campus Universitário - UFMT</div>
                    {activeAlerts.map((alert, index) => {
                      const mapX = 30 + (alert.longitude + 46.6333) * 1000 + index * 15;
                      const mapY = 40 + (alert.latitude + 23.5505) * 1000 + index * 10;
                      return (
                        <div key={alert.id} className="absolute animate-pulse cursor-pointer" style={{left: `${Math.max(10, Math.min(80, mapX))}%`, top: `${Math.max(10, Math.min(80, mapY))}%`}} onClick={() => setSelectedAlert(alert)}>
                          <div className="relative">
                            <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><AlertTriangle className="w-3 h-3 text-white" /></div>
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">{alert.student_name}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5" />Alertas Recentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500"><AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Nenhum alerta registrado</p></div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedAlert?.id === alert.id ? "bg-blue-50 border-blue-200" : "bg-white hover:bg-gray-50"}`} onClick={() => setSelectedAlert(alert)}>
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10"><AvatarImage src="/diverse-students-studying.png" /><AvatarFallback>{alert.student_name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{alert.student_name}</p>
                            <Badge variant="secondary" className={`${getStatusColor(alert.status)} text-white text-xs`}>{getStatusText(alert.status)}</Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{alert.course || "Curso não informado"}</p>
                          <p className="text-xs text-gray-500 mb-1">ID: {alert.student_id}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{getTimeSince(alert.created_at)}</span>
                            <span className="flex items-center gap-1"><Navigation className="w-3 h-3" />GPS</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            {selectedAlert && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" />Detalhes do Alerta #{selectedAlert.id}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-center gap-3">
                    <Avatar><AvatarImage src="/diverse-student-profiles.png" /><AvatarFallback>{selectedAlert.student_name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                    <div>
                      <p className="font-medium">{selectedAlert.student_name}</p>
                      <p className="text-sm text-gray-600">{selectedAlert.course || "Curso não informado"}</p>
                      <p className="text-sm text-gray-600">ID: {selectedAlert.student_id}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-gray-500" /><span>Acionado em: {formatTime(selectedAlert.created_at)}</span></div>
                    <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-gray-500" /><span>Localização: {selectedAlert.latitude.toFixed(6)}, {selectedAlert.longitude.toFixed(6)}</span></div>
                    <div className="flex items-center gap-2 text-sm"><Navigation className="w-4 h-4 text-blue-500" /><span>Última atualização: {formatTime(selectedAlert.updated_at)}</span></div>
                    {selectedAlert.resolved_at && (<div className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /><span>Resolvido em: {formatTime(selectedAlert.resolved_at)}</span></div>)}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Ações:</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" onClick={() => handleUpdateAlertStatus(selectedAlert.id, "in_progress")} className="bg-yellow-600 hover:bg-yellow-700" disabled={selectedAlert.status === "in_progress"}>Em Andamento</Button>
                      <Button size="sm" onClick={() => handleUpdateAlertStatus(selectedAlert.id, "resolved")} className="bg-green-600 hover:bg-green-700" disabled={selectedAlert.status === "resolved"}><CheckCircle className="w-4 h-4 mr-1" />Resolver</Button>
                      <Button size="sm" variant="outline" onClick={() => handleUpdateAlertStatus(selectedAlert.id, "false_alarm")} disabled={selectedAlert.status === "false_alarm"}>Falso Alarme</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
         <div className="mt-6">
          <StatsDashboard />
        </div>
      </div>
    </div>
  )
}
