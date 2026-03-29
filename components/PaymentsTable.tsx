'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { CreditCard, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Payment {
  id: number;
  customerId: number;
  paidAmount: number;
  discount: number;
  balance: number;
  date: string;
  customer: { name: string; phone: string };
  user: { username: string };
}

export default function PaymentsTable() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/payments');
      if (!response.ok) throw new Error('Failed to fetch payments');
      const data = await response.json();
      setPayments(data);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching payments:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load payments.', timer: 3000, showConfirmButton: false });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const formatCurrency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const totalPages = Math.ceil(payments.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const current = payments.slice(start, start + itemsPerPage);
  const totalAmount = payments.reduce((sum, p) => sum + p.paidAmount, 0);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden w-full min-w-0">
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Payments</h2>
        <p className="text-sm text-gray-500 mt-1">All payment transactions</p>
      </div>
      <div className="p-4 sm:p-6 grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-600 font-medium">Total Payments</p>
          <p className="text-2xl font-bold text-blue-700">{payments.length}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-600 font-medium">Total Amount</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalAmount)}</p>
        </div>
      </div>
      <div className="overflow-x-auto -mx-px sm:mx-0">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Discount</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Balance</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Processed By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {current.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 sm:px-6 py-8 sm:py-12 text-center text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  No payments recorded yet.
                </td>
              </tr>
            ) : (
              current.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-900 whitespace-nowrap">{formatDate(p.date)}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 max-w-[200px] sm:max-w-none">
                    <p className="font-medium text-gray-900 break-words">{p.customer.name}</p>
                    <p className="text-xs text-gray-500 break-all">{p.customer.phone || '—'}</p>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-blue-600">{formatCurrency(p.paidAmount)}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 hidden md:table-cell">{formatCurrency(p.discount)}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 hidden md:table-cell">{formatCurrency(p.balance)}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 hidden lg:table-cell">{p.user.username}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-sm text-gray-600">
          Showing {payments.length === 0 ? 0 : start + 1}–{Math.min(start + itemsPerPage, payments.length)} of {payments.length}
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
            disabled={currentPage === totalPages || payments.length === 0}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
