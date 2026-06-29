import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../services/api';
import { RoleResponse } from '../../../types/iam';

interface FormErrors {
  name?: string;
  code?: string;
}

const RoleView: React.FC = () => {
  const [items, setItems] = useState<RoleResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Custom Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<RoleResponse | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<RoleResponse | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  // Fetch Roles from Backend API
  const fetchRoles = async (): Promise<void> => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await api.get('/hotel/api/v1/iam/roles');
      setItems(Array.isArray(data) ? (data as RoleResponse[]) : []);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosError.response?.data?.message || 'Failed to fetch roles from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenCreate = (): void => {
    setEditingItem(null);
    setFormData({
      name: '',
      code: '',
      status: 'ACTIVE'
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: RoleResponse): void => {
    setEditingItem(role);
    setFormData({
      name: role.name,
      code: role.code,
      status: role.status
    });
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Role name is required';
    if (!formData.code.trim()) {
      newErrors.code = 'Role code is required';
    } else if (!/^[A-Z0-9_]{3,20}$/.test(formData.code.trim())) {
      newErrors.code = 'Code must be 3-20 uppercase alphanumeric characters or underscores';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setSubmitError(null);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        status: formData.status
      };

      if (editingItem) {
        // PUT Request
        await api.put(`/hotel/api/v1/iam/roles/${editingItem.id}`, payload);
      } else {
        // POST Request
        await api.post('/hotel/api/v1/iam/roles', payload);
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setSubmitError(axiosError.response?.data?.message || 'Failed to save role. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Custom delete modal
  const handleOpenDelete = (role: RoleResponse): void => {
    setItemToDelete(role);
    setIsDeleteModalOpen(true);
  };

  // Execute Asynchronous API Delete
  const handleConfirmDelete = async (): Promise<void> => {
    if (!itemToDelete) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      await api.delete(`/hotel/api/v1/iam/roles/${itemToDelete.id}`);
      fetchRoles();
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosError.response?.data?.message || 'Failed to delete role.');
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative space-y-6 min-h-[400px]">
      {/* LOADING OVERLAY */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-[2px] flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            <span className="text-xs font-bold text-neutral-900 tracking-wider uppercase">Processing Request...</span>
          </div>
        </div>
      )}

      {/* TOP API FETCH ERROR BANNER */}
      {fetchError && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-655 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-707">{fetchError}</span>
          </div>
          <button 
            type="button"
            onClick={() => setFetchError(null)}
            className="text-red-600 hover:text-red-800 transition-colors focus:outline-none"
            aria-label="Dismiss fetch error"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-black tracking-tight">System Roles</h2>
          <p className="text-sm text-neutral-500">Configure authorization roles mapped to staff credentials.</p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-600 text-white font-bold rounded shadow hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 w-full sm:w-auto"
          aria-label="Add new system role"
        >
          <Plus className="w-5 h-5" />
          <span>Add Role</span>
        </button>
      </div>

      {/* Listing Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900 text-white uppercase text-[11px] font-bold tracking-wider">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Role Code</th>
                <th className="py-4 px-6">Role Name</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-sm">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-500 font-medium bg-neutral-50">
                    No roles registered.
                  </td>
                </tr>
              ) : (
                items.map((role) => (
                  <tr key={role.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-neutral-955">{role.id}</td>
                    <td className="py-4 px-6 font-mono font-bold text-red-600">{role.code}</td>
                    <td className="py-4 px-6 font-semibold text-black">{role.name}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                        ${role.status === 'ACTIVE' 
                          ? 'bg-neutral-100 text-black border border-neutral-300' 
                          : 'bg-red-50 text-red-600 border border-red-200'
                        }
                      `}>
                        {role.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(role)}
                          className="p-1.5 rounded hover:bg-neutral-100 text-neutral-700 hover:text-black focus:outline-none focus:ring-2 focus:ring-red-650"
                          aria-label={`Edit role ${role.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(role)}
                          className="p-1.5 rounded hover:bg-red-50 text-neutral-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-650"
                          aria-label={`Delete role ${role.name}`}
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-65 transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative bg-white border border-neutral-200 rounded-lg shadow-xl w-full max-w-md z-10 overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold uppercase tracking-wider">
                {editingItem ? 'Edit Role' : 'Create Role'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-600"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MUTATION ERROR ALERT BOX */}
            {submitError && (
              <div className="bg-red-50 border-l-4 border-red-600 p-4 m-6 mb-0 rounded flex items-center justify-between shadow-sm animate-fade-in">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-605 flex-shrink-0" />
                  <span className="text-sm font-semibold text-red-707">{submitError}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setSubmitError(null)}
                  className="text-red-600 hover:text-red-800 transition-colors focus:outline-none"
                  aria-label="Dismiss submit error"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Code */}
              <div>
                <label htmlFor="role-code" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Role Code *
                </label>
                <input
                  type="text"
                  id="role-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className={`w-full px-3 py-2 border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-600
                    ${errors.code ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                  `}
                  placeholder="E.g., OPERATOR_FRONT"
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.code && (
                  <p className="mt-1 text-xs text-red-655 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.code}</span>
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label htmlFor="role-name" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Role Name *
                </label>
                <input
                  type="text"
                  id="role-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600
                    ${errors.name ? 'border-red-600 focus:border-red-600' : 'border-neutral-300 focus:border-black'}
                  `}
                  placeholder="E.g., Front Desk Clerk"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-655 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label htmlFor="role-status" className="block text-xs font-bold uppercase text-neutral-900 tracking-wider mb-1">
                  Status
                </label>
                <select
                  id="role-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-black"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 hover:text-black hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-red-650"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md text-sm shadow transition-colors focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px] animate-fade-in">
          <div 
            className="fixed inset-0" 
            onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center border border-neutral-200 z-10 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-black uppercase tracking-wider mb-2">Confirm Destruction</h3>
            <p className="text-sm text-neutral-600 mb-6">
              Are you sure you want to permanently delete role: <strong className="text-neutral-900 font-bold">{itemToDelete?.name} ({itemToDelete?.code})</strong>? This action cannot be undone.
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
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-650"
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

export default RoleView;
