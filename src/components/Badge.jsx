import React from 'react'

export const CategoryBadge = ({ category }) => {
  const map = {
    alimentos: { label: 'Alimentos', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
    roupas: { label: 'Roupas', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
    higiene: { label: 'Higiene', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    brinquedos: { label: 'Brinquedos', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
    outros: { label: 'Outros', bg: 'bg-slate-100 text-slate-800 border-slate-200' },
  }

  const item = map[category] || { label: category, bg: 'bg-gray-100 text-gray-800 border-gray-200' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.bg}`}>
      {item.label}
    </span>
  )
}

export const ConditionBadge = ({ condition }) => {
  const map = {
    novo: { label: 'Novo', bg: 'bg-green-100 text-green-800 border-green-200' },
    bom: { label: 'Bom estado', bg: 'bg-sky-100 text-sky-800 border-sky-200' },
    usado: { label: 'Usado', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
    necessita_atencao: { label: 'Requer atenção', bg: 'bg-rose-100 text-rose-800 border-rose-200' },
  }

  const item = map[condition] || { label: condition, bg: 'bg-gray-100 text-gray-800 border-gray-200' }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${item.bg}`}>
      {item.label}
    </span>
  )
}

export const PriorityBadge = ({ priority }) => {
  const map = {
    alta: { label: 'Prioridade Alta', bg: 'bg-rose-100 text-rose-800 border-rose-300' },
    media: { label: 'Prioridade Média', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
    baixa: { label: 'Prioridade Baixa', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  }

  const item = map[priority] || { label: priority, bg: 'bg-gray-100 text-gray-800 border-gray-200' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${item.bg}`}>
      {item.label}
    </span>
  )
}
