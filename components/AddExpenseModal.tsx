'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { DollarSign, X } from 'lucide-react';

export interface ExpenseFormValues {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  date: string;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** When set, modal updates this expense instead of creating a new one */
  editingExpense?: ExpenseFormValues | null;
}

function toDateInputValue(isoDate: string) {
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export default function AddExpenseModal({ isOpen, onClose, onSuccess, editingExpense }: AddExpenseModalProps) {
  const [formData, setFormData] = useState({
    type: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingExpense) {
      setFormData({
        type: editingExpense.type,
        amount: String(editingExpense.amount),
        description: editingExpense.description || '',
        date: toDateInputValue(editingExpense.date),
      });
    } else {
      setFormData({
        type: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [isOpen, editingExpense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.type.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Type required',
        text: 'Please enter an expense type.',
        timer: 2000,
        showConfirmButton: false,
      });
      setIsLoading(false);
      return;
    }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Amount',
        text: 'Please enter a valid amount greater than 0.',
        timer: 2000,
        showConfirmButton: false,
      });
      setIsLoading(false);
      return;
    }

    try {
      const isEdit = Boolean(editingExpense);
      const url = isEdit ? `/api/expenses/${editingExpense!.id}` : '/api/expenses';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          amount,
          description: formData.description || undefined,
          date: formData.date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (isEdit ? 'Failed to update expense' : 'Failed to create expense'));
      }

      setFormData({
        type: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });

      onSuccess();

      Swal.fire({
        icon: 'success',
        title: isEdit ? 'Expense updated' : 'Expense added',
        text: isEdit ? 'Changes have been saved.' : 'Expense has been recorded successfully.',
        timer: 2000,
        showConfirmButton: false,
      });

      onClose();
    } catch (error) {
      console.error('Error creating expense:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: error instanceof Error ? error.message : 'Failed to add expense. Please try again.',
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 my-4 mx-2 sm:mx-4">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex justify-between items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {editingExpense ? 'Edit Expense' : 'Add Expense'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <input
              type="text"
              name="type"
              required
              value={formData.type}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="e.g. Rent, Supplies, Utilities"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-all duration-200 text-gray-900 disabled:opacity-50 placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-all duration-200 text-gray-900 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <DollarSign className="w-4 h-4" />
              </span>
              <input
                type="number"
                name="amount"
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-all duration-200 text-gray-900 disabled:opacity-50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Optional description..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-all duration-200 text-gray-900 disabled:opacity-50"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg disabled:opacity-50"
            >
              {isLoading ? (editingExpense ? 'Saving...' : 'Adding...') : editingExpense ? 'Save changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
