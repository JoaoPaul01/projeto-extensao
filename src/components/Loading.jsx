import React from 'react'
import { Loader2 } from 'lucide-react'

export const Loading = ({ message = 'Carregando informações...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}
