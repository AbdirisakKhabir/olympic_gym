'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Receipt, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Expense {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  date: string;
}

export default function ExpensesTable({ onAddExpense }: { onAddExpense: () => void }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/expenses');
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      setExpenses(data);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load expenses.', timer: 3000, showConfirmButton: false });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const formatCurrency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const totalPages = Math.ceil(expenses.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const current = expenses.slice(start, start + itemsPerPage);
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Expenses</h2>
          <p className="text-sm text-gray-500 mt-1">View and manage all expenses</p>
        </div>
        <button
          onClick={onAddExpense}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
        >
          Add Expense
        </button>
      </div>
      <div className="p-6 grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-600 font-medium">Total Expenses</p>
          <p className="text-2xl font-bold text-blue-700">{expenses.length}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-600 font-medium">Total Amount</p>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalAmount)}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {current.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  No expenses recorded yet.
                </td>
              </tr>
            ) : (
              current.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">{formatDate(e.date || '')}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{e.type}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-blue-600">{formatCurrency(e.amount)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{e.description || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {expenses.length === 0 ? 0 : start + 1}–{Math.min(start + itemsPerPage, expenses.length)} of {expenses.length}
        </p>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-2 text-sm text-gray-600 font-medium">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || expenses.length === 0}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
