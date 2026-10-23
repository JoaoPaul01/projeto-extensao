import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Loading } from '../components/Loading'
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  Package,
  Send,
  Building,
  ShieldCheck,
  RefreshCw
} from 'lucide-react'

export const Reports = () => {
  // Filtros de período (padrão: últimos 30 dias até hoje)
  const todayStr = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(thirtyDaysAgoStr)
  const [endDate, setEndDate] = useState(todayStr)
  const [reportType, setReportType] = useState('todos') // 'todos' | 'entradas' | 'saidas'

  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState({
    totalReceived: 0,
    totalDestined: 0,
    destinationsCount: 0,
    donationsCount: 0,
  })

  const fetchReportData = async () => {
    try {
      setLoading(true)

      // 1. Buscar doações no período
      const { data: donations, error: donError } = await supabase
        .from('donations')
        .select('*')
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date', { ascending: false })

      if (donError) throw donError

      // 2. Buscar destinações no período
      const { data: destinations, error: destError } = await supabase
        .from('destinations')
        .select('*, donations(description, unit, category)')
        .gte('destination_date', startDate)
        .lte('destination_date', endDate)
        .order('destination_date', { ascending: false })

      if (destError) throw destError

      // Consolidar em uma lista única
      const mappedDonations = (donations || []).map((d) => ({
        id: d.id,
        type: 'entrada',
        typeLabel: 'Entrada (Recebida)',
        date: d.entry_date,
        description: d.description,
        category: d.category,
        quantity: Number(d.quantity),
        unit: d.unit,
        originOrDestination: d.donor_name || 'Anônimo',
        notes: d.notes || '-',
      }))

      const mappedDestinations = (destinations || []).map((dst) => ({
        id: dst.id,
        type: 'saida',
        typeLabel: 'Saída (Destinação)',
        date: dst.destination_date,
        description: dst.donations?.description || 'Item doado',
        category: dst.donations?.category || 'geral',
        quantity: Number(dst.quantity),
        unit: dst.donations?.unit || 'un',
        originOrDestination: dst.destination_target,
        notes: dst.notes || '-',
      }))

      let combined = []
      if (reportType === 'todos') {
        combined = [...mappedDonations, ...mappedDestinations]
      } else if (reportType === 'entradas') {
        combined = mappedDonations
      } else {
        combined = mappedDestinations
      }

      combined.sort((a, b) => new Date(b.date) - new Date(a.date))
      setRecords(combined)

      // Totais para resumo
      const totRec = (donations || []).reduce((acc, curr) => acc + Number(curr.quantity), 0)
      const totDest = (destinations || []).reduce((acc, curr) => acc + Number(curr.quantity), 0)

      setSummary({
        totalReceived: totRec,
        totalDestined: totDest,
        donationsCount: donations?.length || 0,
        destinationsCount: destinations?.length || 0,
      })
    } catch (err) {
      console.error('Erro ao gerar relatório:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [startDate, endDate, reportType])

  // Exportação para arquivo CSV (com UTF-8 BOM para abrir com acentuação correta no Excel)
  const handleExportCSV = () => {
    if (records.length === 0) {
      alert('Não há registros no período para exportar.')
      return
    }

    const headers = ['Tipo', 'Data', 'Item', 'Categoria', 'Quantidade', 'Unidade', 'Origem ou Destino Coletivo', 'Observações']
    const rows = records.map((r) => [
      r.typeLabel,
      new Date(r.date + 'T00:00:00').toLocaleDateString('pt-BR'),
      `"${r.description.replace(/"/g, '""')}"`,
      r.category,
      r.quantity,
      r.unit,
      `"${r.originOrDestination.replace(/"/g, '""')}"`,
      `"${r.notes.replace(/"/g, '""')}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `prestacao_contas_doacoes_${startDate}_a_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Impressão / Salvar como PDF
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Cabeçalho da Página (Visível em Tela) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Prestação de Contas & Relatórios</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Geração de relatórios transparentes com filtros temporais, exportação CSV e impressão
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-2xl shadow-sm shadow-emerald-200 transition-all text-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl shadow-sm transition-all text-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Cabeçalho exclusivo para impressão (Aparece apenas ao imprimir) */}
      <div className="hidden print-only mb-6 border-b-2 border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-slate-900">Acolher - Gestão Solidária</h1>
        <p className="text-sm text-slate-700">Relatório Oficial de Prestação de Contas e Movimentação de Doações</p>
        <p className="text-xs text-slate-500 mt-1">
          Período auditado: {new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')} até{' '}
          {new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR')} • Emitido em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
        </p>
      </div>

      {/* Painel de Filtros (Oculto na Impressão) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6 no-print space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Filtros do Relatório</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Data Final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Movimentação</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Todas (Entradas e Destinações)</option>
              <option value="entradas">Apenas Entradas (Doações Recebidas)</option>
              <option value="saidas">Apenas Saídas (Destinações Realizadas)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards de Resumo Consolidado do Período */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="block text-[11px] font-bold text-slate-400 uppercase">Lotes Recebidos</span>
          <span className="text-xl sm:text-2xl font-black text-slate-800">{summary.donationsCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="block text-[11px] font-bold text-slate-400 uppercase">Volume Recebido</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600">{summary.totalReceived}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="block text-[11px] font-bold text-slate-400 uppercase">Ações de Destinação</span>
          <span className="text-xl sm:text-2xl font-black text-slate-800">{summary.destinationsCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="block text-[11px] font-bold text-slate-400 uppercase">Volume Destinado</span>
          <span className="text-xl sm:text-2xl font-black text-blue-600">{summary.totalDestined}</span>
        </div>
      </div>

      {/* Tabela de Dados Formatada */}
      {loading ? (
        <Loading message="Gerando balanço do período..." />
      ) : records.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Nenhuma movimentação encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Não foram registradas entradas ou destinações entre as datas selecionadas.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Descrição do Item</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Quantidade</th>
                  <th className="py-3 px-4">Origem / Destino Coletivo</th>
                  <th className="py-3 px-4">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      {r.type === 'entrada' ? (
                        <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Entrada
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          Destinação
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-500 whitespace-nowrap">
                      {new Date(r.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{r.description}</td>
                    <td className="py-3 px-4 font-medium text-slate-500 uppercase text-[10px]">{r.category}</td>
                    <td className="py-3 px-4 font-bold text-slate-700 whitespace-nowrap">
                      {r.quantity} {r.unit}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">{r.originOrDestination}</td>
                    <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Nota de Rodapé LGPD e Prestação de Contas */}
      <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-500 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Declaração de Transparência e LGPD:</strong> Este relatório cumpre os requisitos de transparência e prestação de contas sociais. Nenhuma informação pessoal sensível ou identificadora de beneficiários foi exposta, resguardando integralmente a privacidade de famílias atendidas.
        </p>
      </div>
    </div>
  )
}
