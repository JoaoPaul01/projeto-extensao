import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CategoryBadge } from '../components/Badge'
import { Send, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck, Box } from 'lucide-react'

export const DestinationForm = ({ selectedDonation, onNavigate, onDestinedSuccess }) => {
  const { user } = useAuth()

  const [availableItems, setAvailableItems] = useState([])
  const [currentDonation, setCurrentDonation] = useState(selectedDonation || null)
  const [loadingItems, setLoadingItems] = useState(!selectedDonation)

  const [formData, setFormData] = useState({
    quantity: '',
    destination_date: new Date().toISOString().split('T')[0],
    destination_target: '',
    notes: '',
  })

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Se não foi pré-selecionado, busca itens com saldo positivo
  useEffect(() => {
    if (!selectedDonation) {
      const fetchAvailable = async () => {
        try {
          setLoadingItems(true)
          const { data, error } = await supabase
            .from('vw_inventory')
            .select('*')
            .gt('quantity_current', 0)
            .order('description')

          if (error) throw error
          setAvailableItems(data || [])
          if (data && data.length > 0) {
            setCurrentDonation(data[0])
          }
        } catch (err) {
          console.error('Erro ao buscar itens disponíveis:', err)
        } finally {
          setLoadingItems(false)
        }
      }
      fetchAvailable()
    } else {
      setCurrentDonation(selectedDonation)
    }
  }, [selectedDonation])

  const maxStock = Number(currentDonation?.quantity_current || 0)

  const handleItemSelect = (e) => {
    const selectedId = e.target.value
    const found = availableItems.find((it) => it.id === selectedId)
    if (found) {
      setCurrentDonation(found)
      setFormData((prev) => ({ ...prev, quantity: '' }))
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleQuickQuantity = (fraction) => {
    if (!maxStock) return
    const calc = Math.min(maxStock, Math.max(1, Math.round(maxStock * fraction)))
    setFormData((prev) => ({ ...prev, quantity: calc.toString() }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!currentDonation) {
      setErrorMessage('Nenhum item do estoque foi selecionado.')
      return
    }

    const numQuantity = parseFloat(formData.quantity)
    if (isNaN(numQuantity) || numQuantity <= 0) {
      setErrorMessage('Informe uma quantidade válida maior que zero.')
      return
    }

    if (numQuantity > maxStock) {
      setErrorMessage(
        `A quantidade informada (${numQuantity} ${currentDonation.unit}) excede o saldo disponível em estoque (${maxStock} ${currentDonation.unit}).`
      )
      return
    }

    if (!formData.destination_target.trim()) {
      setErrorMessage('Informe o destino coletivo da doação (ex.: "Cestas de Páscoa", "Abrigo Parceiro").')
      return
    }

    try {
      setLoading(true)

      const payload = {
        donation_id: currentDonation.id,
        quantity: numQuantity,
        destination_date: formData.destination_date,
        destination_target: formData.destination_target.trim(),
        notes: formData.notes.trim() ? formData.notes.trim() : null,
        created_by: user?.id || null,
      }

      const { error } = await supabase.from('destinations').insert([payload])

      if (error) throw error

      setSuccessMessage(
        `Destinação de ${numQuantity} ${currentDonation.unit} realizada com sucesso para "${formData.destination_target}"!`
      )

      if (onDestinedSuccess) {
        onDestinedSuccess()
      }

      // Atualiza o saldo localmente para refletir imediatamente
      setCurrentDonation((prev) => ({
        ...prev,
        quantity_current: Math.max(0, maxStock - numQuantity),
        quantity_destined: Number(prev.quantity_destined || 0) + numQuantity,
      }))

      setFormData((prev) => ({
        ...prev,
        quantity: '',
        destination_target: '',
        notes: '',
      }))
    } catch (err) {
      console.error('Falha ao registrar destinação:', err)
      setErrorMessage('Erro ao salvar destinação: ' + (err.message || 'Erro inesperado'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Botão Voltar */}
      <button
        onClick={() => onNavigate('inventory')}
        className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar ao Estoque</span>
      </button>

      {/* Cartão Principal */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Registrar Destinação (Saída)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Encaminhe itens do estoque para ações sociais e abrigos parceiros
            </p>
          </div>
        </div>

        {/* Mensagens de Sucesso e Erro */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-bold underline hover:text-emerald-900 ml-4"
            >
              Conferir Estoque
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Detalhes do Item e Trava de Saldo */}
        {currentDonation ? (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-emerald-50/40 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <CategoryBadge category={currentDonation.category} />
                  <span className="text-xs font-medium text-slate-500">
                    Entrada em {new Date(currentDonation.entry_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800">{currentDonation.description}</h3>
              </div>

              {/* Destaque do Saldo em Estoque */}
              <div className="bg-white px-4 py-2.5 rounded-2xl border border-emerald-200 shadow-sm text-center sm:text-right">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Saldo Disponível
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600">
                  {maxStock}{' '}
                  <span className="text-xs font-bold text-slate-600">{currentDonation.unit}</span>
                </span>
              </div>
            </div>
          </div>
        ) : loadingItems ? (
          <div className="p-6 text-center text-slate-500 text-sm">Carregando itens disponíveis...</div>
        ) : (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm">
            Não há itens com saldo disponível no estoque para destinação no momento.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selecionador de Item caso não venha pré-selecionado */}
          {!selectedDonation && availableItems.length > 0 && (
            <div>
              <label htmlFor="select-item" className="block text-sm font-bold text-slate-700">
                Selecione o Item a ser Destinado <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-item"
                value={currentDonation?.id || ''}
                onChange={handleItemSelect}
                className="mt-1.5 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium transition-all"
              >
                {availableItems.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.description} — Saldo: {it.quantity_current} {it.unit}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantidade a Destinar e Atalhos Rápidos */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="quantity" className="block text-sm font-bold text-slate-700">
                Quantidade a Encaminhar <span className="text-rose-500">*</span>
              </label>
              {maxStock > 0 && (
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickQuantity(0.5)}
                    className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    50% ({Math.round(maxStock * 0.5)})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickQuantity(1)}
                    className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                  >
                    Tudo ({maxStock})
                  </button>
                </div>
              )}
            </div>

            <div className="relative rounded-2xl shadow-sm">
              <input
                type="number"
                id="quantity"
                name="quantity"
                required
                min="0.01"
                max={maxStock}
                step="any"
                value={formData.quantity}
                onChange={handleChange}
                placeholder={`Máximo permitido: ${maxStock}`}
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-bold transition-all"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                {currentDonation?.unit || 'un'}
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              O sistema não permite registrar uma quantidade superior a {maxStock} {currentDonation?.unit}.
            </p>
          </div>

          {/* Destino e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="destination_date" className="block text-sm font-bold text-slate-700">
                Data do Encaminhamento <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                id="destination_date"
                name="destination_date"
                required
                value={formData.destination_date}
                onChange={handleChange}
                className="mt-1.5 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
              />
            </div>

            <div>
              <label htmlFor="destination_target" className="block text-sm font-bold text-slate-700">
                Destino Coletivo / Ação Social <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="destination_target"
                name="destination_target"
                required
                value={formData.destination_target}
                onChange={handleChange}
                placeholder="Ex.: Ação Sopão de Inverno, Cestas Básicas Março..."
                className="mt-1.5 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
              />
            </div>
          </div>

          {/* Aviso LGPD */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong>Proteção de Dados (LGPD):</strong> Registre a destinação de forma genérica (ex: nome do abrigo parceiro, mutirão ou projeto comunitário). Não informe nomes, documentos ou endereços de pessoas atendidas.
            </span>
          </div>

          {/* Observações da Destinação */}
          <div>
            <label htmlFor="notes" className="block text-sm font-bold text-slate-700">
              Observações sobre o Encaminhamento <span className="text-xs font-normal text-slate-500">(Opcional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Ex.: Itens conferidos antes da entrega, transporte realizado pelo veículo da instituição..."
              className="mt-1.5 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
            />
          </div>

          {/* Botões */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="w-full sm:w-auto px-6 py-3 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-2xl font-bold text-sm transition-colors text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || maxStock <= 0}
              className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl font-bold text-sm shadow-md shadow-emerald-200 transition-all disabled:opacity-50 text-center"
            >
              {loading ? 'Processando Saída...' : 'Confirmar Destinação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
