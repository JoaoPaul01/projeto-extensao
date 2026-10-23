import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { StatCard } from '../components/StatCard'
import { CategoryBadge, PriorityBadge } from '../components/Badge'
import { Loading } from '../components/Loading'
import {
  Package,
  CalendarCheck,
  AlertTriangle,
  Flame,
  ArrowRight,
  PlusCircle,
  Send,
  AlertCircle,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react'

export const Dashboard = ({ onNavigate, onSelectDonationForDestination }) => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStockCount: 0,
    donationsThisMonthCount: 0,
    nearExpiryItems: [],
    urgentNeeds: [],
    categoryBreakdown: {},
    recentActivity: [],
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // 1. Estoque Geral
        const { data: inventory, error: invError } = await supabase
          .from('vw_inventory')
          .select('*')

        if (invError) throw invError

        // 2. Necessidades Abertas de Alta Prioridade
        const { data: needs, error: needsError } = await supabase
          .from('needs')
          .select('*')
          .eq('status', 'aberta')
          .eq('priority', 'alta')
          .limit(4)

        if (needsError) throw needsError

        // 3. Últimas Destinações
        const { data: recentDestinations, error: destError } = await supabase
          .from('destinations')
          .select('*, donations(description, unit)')
          .order('destination_date', { ascending: false })
          .limit(5)

        if (destError) throw destError

        // Cálculos e Agrupamentos
        const today = new Date()
        const currentMonth = today.getMonth()
        const currentYear = today.getFullYear()

        let totalCurrent = 0
        let thisMonthCount = 0
        const nearExpiry = []
        const categories = {
          alimentos: 0,
          roupas: 0,
          higiene: 0,
          brinquedos: 0,
          outros: 0,
        }

        const fifteenDaysFromNow = new Date()
        fifteenDaysFromNow.setDate(today.getDate() + 15)

        inventory?.forEach((item) => {
          const qty = Number(item.quantity_current || 0)
          totalCurrent += qty

          // Categoria
          if (categories[item.category] !== undefined) {
            categories[item.category] += qty
          } else {
            categories[item.category] = qty
          }

          // Doações do mês
          if (item.entry_date) {
            const entry = new Date(item.entry_date + 'T00:00:00')
            if (entry.getMonth() === currentMonth && entry.getFullYear() === currentYear) {
              thisMonthCount += 1
            }
          }

          // Validade próxima (saldo > 0 e validade <= 15 dias)
          if (item.expiration_date && qty > 0) {
            const exp = new Date(item.expiration_date + 'T23:59:59')
            if (exp <= fifteenDaysFromNow) {
              nearExpiry.push(item)
            }
          }
        })

        // Unificar atividades recentes (entradas e saídas)
        const recentEntries = (inventory || [])
          .slice(0, 4)
          .map((it) => ({
            type: 'entrada',
            date: it.entry_date,
            description: it.description,
            quantity: `${it.quantity_received} ${it.unit}`,
            targetOrDonor: it.donor_name || 'Anônimo',
          }))

        const recentExits = (recentDestinations || []).map((dst) => ({
          type: 'saida',
          date: dst.destination_date,
          description: dst.donations?.description || 'Item doado',
          quantity: `${dst.quantity} ${dst.donations?.unit || 'un'}`,
          targetOrDonor: dst.destination_target,
        }))

        const combinedActivity = [...recentEntries, ...recentExits]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 6)

        setStats({
          totalStockCount: totalCurrent,
          donationsThisMonthCount: thisMonthCount,
          nearExpiryItems: nearExpiry,
          urgentNeeds: needs || [],
          categoryBreakdown: categories,
          recentActivity: combinedActivity,
        })
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return <Loading message="Preparando o painel de controle..." />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner de Boas-Vindas e Ações Rápidas */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-900/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-600/60 text-emerald-100 border border-emerald-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-300" /> Visão Geral do Dia
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Gestão de Doações & Estoque Social
            </h1>
            <p className="text-emerald-100/90 text-sm mt-1 leading-relaxed">
              Acompanhe o fluxo de arrecadação, controle o estoque em tempo real e agilize as entregas para quem mais precisa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('donation-form')}
              className="flex items-center space-x-2 px-5 py-3 bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <span>Registrar Doação</span>
            </button>
            <button
              onClick={() => onNavigate('inventory')}
              className="flex items-center space-x-2 px-5 py-3 bg-emerald-600/80 hover:bg-emerald-600 text-white border border-emerald-400/40 rounded-2xl font-bold text-sm transition-all"
            >
              <Send className="w-5 h-5" />
              <span>Destinar Itens</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cartões Estatísticos Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Saldo Geral em Estoque"
          value={stats.totalStockCount}
          subtitle="Itens disponíveis para encaminhamento"
          icon={Package}
          color="emerald"
        />
        <StatCard
          title="Doações no Mês"
          value={stats.donationsThisMonthCount}
          subtitle="Lotes recebidos no mês atual"
          icon={CalendarCheck}
          color="blue"
        />
        <StatCard
          title="Validade Próxima (&lt; 15d)"
          value={stats.nearExpiryItems.length}
          subtitle={
            stats.nearExpiryItems.length > 0
              ? 'Atenção necessária para perecíveis'
              : 'Nenhum item com vencimento próximo'
          }
          icon={AlertTriangle}
          color={stats.nearExpiryItems.length > 0 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Necessidades Urgentes"
          value={stats.urgentNeeds.length}
          subtitle="Demandas de alta prioridade abertas"
          icon={Flame}
          color="amber"
        />
      </div>

      {/* Alerta Destacado: Itens com Vencimento Próximo */}
      {stats.nearExpiryItems.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900">
                  Alerta de Perecíveis: {stats.nearExpiryItems.length} item(ns) próximo(s) da validade
                </h3>
                <p className="text-xs text-rose-700">
                  Priorize a destinação destes alimentos para evitar perdas e garantir o aproveitamento total.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 underline hidden sm:inline-block"
            >
              Ver todos no estoque
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.nearExpiryItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.description}</p>
                  <p className="text-xs text-slate-500">
                    Saldo: <strong className="text-emerald-700">{item.quantity_current} {item.unit}</strong> • Vence:{' '}
                    <strong className="text-rose-600">
                      {new Date(item.expiration_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </strong>
                  </p>
                </div>
                <button
                  onClick={() => onSelectDonationForDestination(item)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors ml-2 flex-shrink-0"
                >
                  Destinar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid Central: Distribuição por Categoria e Necessidades Urgentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Distribuição de Estoque por Categoria */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-black text-slate-800">Itens em Estoque por Categoria</h2>
              <p className="text-xs text-slate-500">Quantidade física disponível para encaminhamento</p>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1"
            >
              <span>Ver Estoque</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.entries(stats.categoryBreakdown).map(([cat, count]) => (
              <div key={cat} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <div>
                  <CategoryBadge category={cat} />
                  <p className="text-2xl font-black text-slate-800 mt-2">{count}</p>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 uppercase font-semibold">Unidades/Volume</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quadro Lateral: Necessidades Urgentes */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-800 flex items-center space-x-1.5">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>Demandas Urgentes</span>
              </h2>
              <button
                onClick={() => onNavigate('needs')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
              >
                Mural
              </button>
            </div>

            {stats.urgentNeeds.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">
                Não há demandas de alta prioridade abertas no momento.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.urgentNeeds.map((need) => (
                  <div key={need.id} className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <CategoryBadge category={need.category} />
                      <span className="text-[10px] font-bold text-rose-700 uppercase">Urgente</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">{need.description}</p>
                    {need.notes && (
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">"{need.notes}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('needs')}
            className="w-full mt-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors text-center"
          >
            Ver Todas as Necessidades
          </button>
        </div>
      </div>

      {/* Últimas Movimentações */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-slate-800 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>Últimas Movimentações Registradas</span>
            </h2>
            <p className="text-xs text-slate-500">Histórico recente de entradas e saídas no sistema</p>
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
          >
            Ver histórico completo
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Quantidade</th>
                <th className="py-3 px-4">Origem / Destino Coletivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recentActivity.map((act, index) => (
                <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    {act.type === 'entrada' ? (
                      <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Entrada
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        Destinação
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-500">
                    {new Date(act.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">{act.description}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{act.quantity}</td>
                  <td className="py-3 px-4 text-slate-600 truncate max-w-[200px]">{act.targetOrDonor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
