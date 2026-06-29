import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import { pricingRuleTypeApi } from '../api/pricingRuleTypeApi';
import PricingRuleTypeModal from './PricingRuleTypeModal';
import { 
  RuleTypeResponse, 
  RuleTypeCreateRequest, 
  RuleTypeUpdateRequest 
} from '../../../../types/pricing';

const PricingRuleTypePage: React.FC = () => {
  const [types, setTypes] = useState<RuleTypeResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<RuleTypeResponse | null>(null);

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<RuleTypeResponse | null>(null);

  const fetchPricingRuleTypes = async (): Promise<void> => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await pricingRuleTypeApi.getAll();
      setTypes(Array.isArray(data) ? (data as RuleTypeResponse[]) : []);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosError.response?.data?.message || 'Failed to fetch pricing rule types.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPricingRuleTypes();
  }, []);

  const handleOpenCreate = (): void => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (typeObj: RuleTypeResponse): void => {
    setEditingItem(typeObj);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: RuleTypeCreateRequest | RuleTypeUpdateRequest): Promise<void> => {
    if (editingItem) {
      // code is immutable, call update endpoint
      const result = await pricingRuleTypeApi.update(editingItem.code, payload as RuleTypeUpdateRequest);
      setTypes(prev => prev.map(t => t.code === editingItem.code ? (result as RuleTypeResponse) : t));
    } else {
      // create new endpoint
      const result = await pricingRuleTypeApi.create(payload as RuleTypeCreateRequest);
      setTypes(prev => [...prev, result as RuleTypeResponse].sort((a, b) => b.priority - a.priority));
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleOpenDelete = (typeObj: RuleTypeResponse): void => {
    setItemToDelete(typeObj);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!itemToDelete) return;
    setIsLoading(true);
    try {
      await pricingRuleTypeApi.delete(itemToDelete.code);
      setTypes(prev => prev.filter(t => t.code !== itemToDelete.code));
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosError.response?.data?.message || 'Failed to delete pricing rule type config.');
      setIsDeleteModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative space-y-6 min-h-[400px]">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-[2px] flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            <span className="text-xs font-bold text-neutral-900 tracking-wider uppercase">Loading Configurations...</span>
          </div>
        </div>
      )}

      {/* Error banner */}
      {fetchError && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-655 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-750">{fetchError}</span>
          </div>
          <button 
            type="button"
            onClick={() => setFetchError(null)}
            className="text-red-600 hover:text-red-800 transition-colors focus:outline-none"
            aria-label="Dismiss error banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-black tracking-tight">Pricing Rule Types</h2>
          <p className="text-sm text-neutral-500">Configure core categories, priority mappings, and rule types for dynamic pricing adjustments.</p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-600 text-white font-bold rounded shadow hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 w-full sm:w-auto"
          aria-label="Create new pricing rule type"
        >
          <Plus className="w-5 h-5" />
          <span>Create Rule Type</span>
        </button>
      </div>

      {/* Configs Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-white uppercase text-[11px] font-bold tracking-wider">
                <th className="py-4 px-6">Rule Code</th>
                <th className="py-4 px-6">Display Name</th>
                <th className="py-4 px-6 text-center">Priority</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm">
              {types.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-neutral-500 font-medium bg-neutral-50">
                    No pricing rule types configured.
                  </td>
                </tr>
              ) : (
                types.map((type) => (
                  <tr key={type.code} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-neutral-955">{type.code}</td>
                    <td className="py-4 px-6 font-bold text-black">{type.displayName}</td>
                    <td className="py-4 px-6 text-center font-mono font-bold text-neutral-800">
                      {type.priority}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(type)}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black focus:outline-none focus:ring-2 focus:ring-red-650"
                          aria-label={`Edit pricing rule type ${type.code}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(type)}
                          className="p-1.5 rounded hover:bg-red-50 text-neutral-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-650"
                          aria-label={`Delete pricing rule type ${type.code}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SAVE DIALOG MODAL */}
      <PricingRuleTypeModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={handleSave}
        editingItem={editingItem}
      />

      {/* CONFIRM DELETE DIALOG */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-65 transition-opacity"
            onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-neutral-200 z-10 animate-scale-in p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-extrabold text-black uppercase tracking-tight mb-2">Delete Pricing Rule Type</h4>
            <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
              Are you sure you want to permanently delete rule configuration:
              <strong className="text-black block mt-2 font-bold bg-neutral-50 p-2.5 rounded border border-neutral-200 font-mono">
                {itemToDelete.code} ({itemToDelete.displayName})
              </strong>
              This action cannot be undone.
            </p>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold py-2 px-4 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-655"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingRuleTypePage;
