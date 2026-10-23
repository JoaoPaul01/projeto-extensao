import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PlusCircle, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react'

export const DonationForm = ({ onNavigate }) => {
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    description: '',
    category: 'alimentos',
    quantity: '',
    unit: 'un',
    entry_date: new Date().toISOString().split('T')[0],
    condition: 'novo',
    expiration_date: '',
    donor_name: '',
    notes: '',
  })

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSetAnonymous = () => {
    setFormData((prev) => ({ ...prev, donor_name: 'Anônimo' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    // Validações
    if (!formData.description.trim()) {
      setErrorMessage('Por favor, informe a descrição do item doado.')
      return
    }

    const numQuantity = parseFloat(formData.quantity)
    if (isNaN(numQuantity) || numQuantity <= 0) {
      setErrorMessage('A quantidade deve ser um número positivo maior que zero.')
      return
    }

    if (!formData.entry_date) {
      setErrorMessage('A data de entrada é obrigatória.')
      return
    }

    try {
      setLoading(true)

      const payload = {
        description: formData.description.trim(),
        category: formData.category,
        quantity: numQuantity,
        unit: formData.unit,
        entry_date: formData.entry_date,
        condition: formData.condition,
        expiration_date: formData.expiration_date ? formData.expiration_date : null,
        donor_name: formData.donor_name.trim() ? formData.donor_name.trim() : 'Anônimo',
        notes: formData.notes.trim() ? formData.notes.trim() : null,
        created_by: user?.id || null,
      }

      const { error } = await supabase.from('donations').insert([payload])

      if (error) throw error

      setSuccessMessage(`Doação de "${formData.description}" cadastrada com sucesso no estoque!`)

      // Resetar campos para permitir novo cadastro
      setFormData({
        description: '',
        category: 'alimentos',
        quantity: '',
        unit: 'un',
        entry_date: new Date().toISOString().split('T')[0],
        condition: 'novo',
        expiration_date: '',
        donor_name: '',
        notes: '',
      })
    } catch (err) {
      console.error('Erro ao cadastrar doação:', err)
      setErrorMessage('Falha ao registrar a doação: ' + (err.message || 'Erro inesperado'))
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

      {/* Cartão do Formulário */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Registrar Nova Doação
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Cadastre itens recebidos para alimentar o controle de estoque
            </p>
          </div>
        </div>

        {/* Mensagem de Sucesso */}
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
              Ver no Estoque
            </button>
          </div>
        )}

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Descrição do Item */}
          <div>
            <label htmlFor="description" className="block text-sm font-bold text-slate-700">
              Descrição do Item <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="description"
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              placeholder="Ex.: Arroz Agulhinha 5kg, Agasalho Infantil, Sabonete..."
              className="mt-1.5 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
            />
          </div>

          {/* Categoria e Unidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-bold text-slate-700">
                Categoria <span className="text-rose-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1.5 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
              >
                <option value="alimentos">Alimentos</option>
                <option value="roupas">Roupas e Agasalhos</option>
                <option value="higiene">Higiene e Limpeza</option>
                <option value="brinquedos">Brinquedos</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            <div>
              <label htmlFor="condition" className="block text-sm font-bold text-slate-700">
                Estado de Conservação <span className="text-rose-500">*</span>
              </label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="mt-1.5 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
              >
                <option value="novo">Novo (Lacrado / Sem uso)</option>
                <option value="bom">Bom estado</option>
                <option value="usado">Usado</option>
                <option value="necessita_atencao">Requer atenção / Reparo</option>
              </select>
            </div>
          </div>

          {/* Quantidade e Unidade de Medida */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-bold text-slate-700">
                Quantidade Recebida <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                required
                min="0.01"
                step="any"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Ex.: 10, 50, 1.5"
                className="mt-1.5 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
              />
            </div>

            <div>
              <label htmlFor="unit" className="block text-sm font-bold text-slate-700">
                Unidade de Medida <span className="text-rose-500">*</span>
              </label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="mt-1.5 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
              >
                <option value="un">Unidade (un)</option>
                <option value="kg">Quilograma (kg)</option>
                <option value="pacote">Pacote</option>
                <option value="caixa">Caixa</option>
                <option value="litro">Litro (L)</option>
                <option value="metro">Metro (m)</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          {/* Datas: Entrada e Validade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="entry_date" className="block text-sm font-bold text-slate-700">
                Data de Entrada <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                id="entry_date"
                name="entry_date"
                required
                value={formData.entry_date}
                onChange={handleChange}
                className="mt-1.5 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
              />
            </div>

            <div>
              <label htmlFor="expiration_date" className="block text-sm font-bold text-slate-700">
                Data de Validade <span className="text-xs font-normal text-slate-500">(Opcional / Perecíveis)</span>
              </label>
              <input
                type="date"
                id="expiration_date"
                name="expiration_date"
                value={formData.expiration_date}
                onChange={handleChange}
                className="mt-1.5 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
              />
            </div>
          </div>

          {/* Doador (com proteção LGPD e botão Anônimo) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="donor_name" className="block text-sm font-bold text-slate-700">
                Doador <span className="text-xs font-normal text-slate-500">(Opcional)</span>
              </label>
              <button
                type="button"
                onClick={handleSetAnonymous}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
              >
                Marcar como "Anônimo"
              </button>
            </div>
            <input
              type="text"
              id="donor_name"
              name="donor_name"
              value={formData.donor_name}
              onChange={handleChange}
              placeholder="Ex.: Campanha da Paróquia, Mercado Central ou deixe em branco"
              className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
            />
            <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>
                <strong>Privacidade LGPD:</strong> Registre apenas o nome ou razão social simples. Nunca colete CPF, telefone ou dados residenciais do doador.
              </span>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label htmlFor="notes" className="block text-sm font-bold text-slate-700">
              Observações Adicionais <span className="text-xs font-normal text-slate-500">(Opcional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Anotações sobre armazenamento, instruções de conservação ou triagem..."
              className="mt-1.5 block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all"
            />
          </div>

          {/* Botões de Ação */}
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
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl font-bold text-sm shadow-md shadow-emerald-200 transition-all disabled:opacity-50 text-center"
            >
              {loading ? 'Salvando Doação...' : 'Salvar no Estoque'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
