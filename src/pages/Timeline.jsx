import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CategoryBadge, ConditionBadge } from '../components/Badge'
import { Loading } from '../components/Loading'
import {
  History,
  ArrowLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle,
  Calendar,
  User,
  ShieldCheck,
  Package,
  Layers
} from 'lucide-react'

export const Timeline = ({ selectedDonation, onNavigate }) => {
  const [donation, setDonation] = useState(selectedDonation || null)
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [allDonations, setAllDonations] = useState([])

  const fetchTimelineData = async (donationId) => {
    try {
      setLoading(true)
      // 1. Buscar dados da doação
      const { data: donData, error: donError } = await supabase
        .from('vw_inventory')
        .select('*')
        .eq('id', donationId)
        .single()

      if (donError) throw donError
      setDonation(donData)

      // 2. Buscar destinações vinculadas
      const { data: destData, error: destError } = await supabase
        .from('destinations')
        .select('*, profiles(name, role)')
        .eq('donation_id', donationId)
        .order('destination_date', { ascending: true })

      if (destError) throw destError
      setDestinations(destData || [])
    } catch (err) {
      console.error('Erro ao carregar linha do tempo:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedDonation?.id) {
      fetchTimelineData(selectedDonation.id)
    } else {
      // Se não há doação selecionada, carrega a lista para escolher
      const fetchList = async () => {
        try {
          const { data } = await supabase
            .from('vw_inventory')
            .select('id, description, unit, quantity_current')
            .order('entry_date', { ascending: false })
          setAllDonations(data || [])
          if (data && data.length > 0) {
            fetchTimelineData(data[0].id)
          } else {
            setLoading(false)
          }
        } catch (e) {
          setLoading(false)
        }
      }
      fetchList()
    }
  }, [selectedDonation])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Botão Voltar */}
      <button
        onClick={() => onNavigate('inventory')}
        className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar ao Estoque</span>
      </button>

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Rastreabilidade & Histórico da Doação
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Ciclo de vida completo: do recebimento ao encaminhamento aos beneficiários
            </p>
          </div>
        </div>

        {/* Seletor se aberto sem item pré-selecionado */}
        {allDonations.length > 0 && !selectedDonation && (
          <div className="w-full sm:w-64">
            <select
              value={donation?.id || ''}
              onChange={(e) => fetchTimelineData(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm"
            >
              {allDonations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.description}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <Loading message="Carregando ciclo de vida do item..." />
      ) : !donation ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-600 font-bold">Nenhuma doação selecionada</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card Resumo do Item */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <CategoryBadge category={donation.category} />
                  <ConditionBadge condition={donation.condition} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">{donation.description}</h2>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Saldo Atual</span>
                  <span className="text-2xl font-black text-emerald-600">
                    {donation.quantity_current} <span className="text-xs text-slate-600">{donation.unit}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Total Recebido:</span>
                <span className="font-bold text-slate-700 text-sm">{donation.quantity_received} {donation.unit}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Total Destinado:</span>
                <span className="font-bold text-slate-700 text-sm">{donation.quantity_destined} {donation.unit}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Doador:</span>
                <span className="font-bold text-slate-700 text-sm truncate block">{donation.donor_name || 'Anônimo'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Validade:</span>
                <span className="font-bold text-slate-700 text-sm">
                  {donation.expiration_date ? new Date(donation.expiration_date).toLocaleDateString('pt-BR') : 'Não perecível'}
                </span>
              </div>
            </div>
          </div>

          {/* Linha do Tempo Visual */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>Linha do Tempo dos Fatos</span>
            </h3>

            <div className="relative pl-6 sm:pl-8 border-l-2 border-emerald-200 space-y-8">
              
              {/* Evento 1: Entrada / Recebimento da Doação */}
              <div className="relative">
                {/* Marcador */}
                <div className="absolute -left-[35px] sm:-left-[43px] top-0.5 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                  <ArrowDownCircle className="w-5 h-5" />
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg inline-block w-fit">
                      1. Recebimento da Doação
                    </span>
                    <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(donation.entry_date).toLocaleDateString('pt-BR')}</span>
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    Entrada de <span className="text-emerald-700 font-bold">{donation.quantity_received} {donation.unit}</span> no estoque da instituição.
                  </p>
                  
                  <div className="mt-2 text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                    <span><strong>Doador:</strong> {donation.donor_name || 'Anônimo'}</span>
                    <span><strong>Conservação:</strong> {donation.condition}</span>
                    {donation.notes && <span><strong>Obs:</strong> "{donation.notes}"</span>}
                  </div>
                </div>
              </div>

              {/* Eventos 2+: Destinações Registradas */}
              {destinations.length === 0 ? (
                <div className="relative">
                  <div className="absolute -left-[35px] sm:-left-[43px] top-0.5 w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200 text-slate-500 text-xs">
                    Nenhuma saída realizada ainda. O saldo total de {donation.quantity_received} {donation.unit} permanece integralmente disponível no estoque.
                  </div>
                </div>
              ) : (
                destinations.map((dest, idx) => (
                  <div key={dest.id} className="relative">
                    {/* Marcador */}
                    <div className="absolute -left-[35px] sm:-left-[43px] top-0.5 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200">
                      <ArrowUpCircle className="w-5 h-5" />
                    </div>

                    <div className="bg-blue-50/40 rounded-2xl p-4 border border-blue-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-lg inline-block w-fit">
                          {idx + 2}. Encaminhamento / Destinação
                        </span>
                        <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(dest.destination_date).toLocaleDateString('pt-BR')}</span>
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-slate-800">
                        Saída de <span className="text-blue-700 font-bold">{dest.quantity} {donation.unit}</span> destinada a: <span className="font-extrabold text-slate-900">"{dest.destination_target}"</span>
                      </p>

                      {dest.notes && (
                        <p className="mt-2 text-xs text-slate-600 italic">
                          Anotação: "{dest.notes}"
                        </p>
                      )}

                      <div className="mt-3 pt-2 border-t border-blue-100/80 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>Operador: {dest.profiles?.name || 'Voluntário da instituição'}</span>
                        </span>
                        <span className="text-emerald-700 font-medium">✓ Auditado no sistema</span>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Status Final */}
              <div className="relative">
                <div className={`absolute -left-[35px] sm:-left-[43px] top-0.5 w-8 h-8 rounded-full flex items-center justify-center ${
                  Number(donation.quantity_current) === 0
                    ? 'bg-purple-600 text-white'
                    : 'bg-emerald-500 text-white'
                }`}>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="pt-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Posição Atual do Lote
                  </p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {Number(donation.quantity_current) === 0 ? (
                      <span className="text-purple-700">Lote 100% destinado aos beneficiários. Estoque zerado.</span>
                    ) : (
                      <span className="text-emerald-700">Lote em estoque ativo: {donation.quantity_current} {donation.unit} disponíveis para destinação.</span>
                    )}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
