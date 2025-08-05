"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, MessageSquare, Shield } from "lucide-react"

export function EmergencyContacts() {
  const contacts = [
    {
      name: "Segurança do Campus",
      phone: "(65) 3615-8000",
      description: "Emergências no campus",
      icon: Shield,
      color: "bg-red-500",
    },
    {
      name: "SAMU",
      phone: "192",
      description: "Emergências médicas",
      icon: Phone,
      color: "bg-blue-500",
    },
    {
      name: "Polícia Militar",
      phone: "190",
      description: "Emergências policiais",
      icon: Shield,
      color: "bg-green-500",
    },
    {
      name: "Bombeiros",
      phone: "193",
      description: "Incêndios e resgates",
      icon: Phone,
      color: "bg-orange-500",
    },
  ]

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`)
  }

  const handleSMS = (phone: string) => {
    window.open(`sms:${phone}`)
  }

  return (
    <Card className="p-0 bg-white border-0 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2 text-lg border-t-1 pt-5">
          <Phone className="w-5 h-5 text-center " />
          Contatos de Emergência
        </CardTitle>
        {/* <CardDescription>Números importantes para situações de emergência</CardDescription> */}
      </CardHeader>
      <CardContent className="space-y-4">
        {contacts.map((contact) => (
          <div key={contact.phone} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50">
            <div className={`w-10 h-10 ${contact.color} rounded-full flex items-center justify-center`}>
              <contact.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-md">{contact.name}</p>
              <p className="text-gray-600 text-xs">{contact.description}</p>
              <p className="text-md font-bold text-blue-600">{contact.phone}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleCall(contact.phone)} className="bg-green-600 hover:bg-green-700">
                <Phone className="w-4 h-4 mr-1" />
                Ligar
              </Button>
             
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
