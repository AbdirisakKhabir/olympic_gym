'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { DollarSign, X, Loader2, Receipt, ChevronLeft, ChevronRight } from 'lucide-react';

interface Expense {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  date: string;
  createdAt: string;
}

interface ExpensesListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpensesListModal({ isOpen, onClose }: ExpensesListModalProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/expenses');

      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }

      const data = await response.json();
      setExpenses(data);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load expenses. Please try again.',
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchExpenses();
    }
  }, [isOpen]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalPages = Math.ceil(expenses.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentExpenses = expenses.slice(indexOfFirstItem, indexOfLastItem);

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Expenses</h2>
              <p className="text-amber-100 mt-1">View and manage all expenses</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-amber-200 transition-colors duration-200 p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-amber-600">{expenses.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
            </div>
          ) : currentExpenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Expenses Found</h3>
              <p className="text-gray-500">There are no expenses recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="bg-white rounded-xl p-4 border border-gray-200 hover:border-amber-300 transition-all duration-200 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          {expense.type}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(expense.date || expense.createdAt)}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 text-lg">
                        {formatCurrency(expense.amount)}
                      </p>
                      {expense.description && (
                        <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, expenses.length)} of{' '}
                {expenses.length} expenses
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => paginate(page)}
                    className={`w-10 h-10 rounded-lg font-semibold ${
                      currentPage === page
                        ? 'bg-amber-500 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
