'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { X } from 'lucide-react';

interface Expense {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  date: string;
  createdAt: string;
}

interface ExpenseReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  type: string;
}

interface ReportData {
  expenses: Expense[];
  totals: {
    totalAmount: number;
    totalExpenses: number;
    byType: Record<string, number>;
  };
  period: {
    startDate: string;
    endDate: string;
  };
}

const EXPENSE_TYPES = [
  '',
  'Rent',
  'Utilities',
  'Supplies',
  'Equipment',
  'Salaries',
  'Maintenance',
  'Marketing',
  'Insurance',
  'Other',
];

export default function ExpenseReportModal({ isOpen, onClose }: ExpenseReportModalProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    type: '',
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      setFilters((prev) => ({
        ...prev,
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0],
      }));
    }
  }, [isOpen]);

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const generateReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Dates',
        text: 'Please select both start and end dates',
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/expenses/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: filters.startDate,
          endDate: filters.endDate,
          type: filters.type || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error generating expense report:', error);
      Swal.fire({
        icon: 'error',
        title: 'Report Generation Failed',
        text: 'Failed to generate expense report. Please try again.',
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const headers = ['Expense Date', 'Type', 'Amount', 'Description'];
    const csvData = reportData.expenses.map((expense) => [
      new Date(expense.date || expense.createdAt).toLocaleDateString(),
      expense.type,
      expense.amount.toFixed(2),
      expense.description || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-report-${filters.startDate}-to-${filters.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      type: '',
    });
    setReportData(null);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Expense Report</h2>
              <p className="text-blue-100 mt-1">Generate detailed expense report for any period</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-amber-200 transition-colors duration-200 p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white transition-all duration-200"
              >
                {EXPENSE_TYPES.map((t) => (
                  <option key={t || 'all'} value={t}>
                    {t || 'All Types'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-between">
            <div className="flex gap-3">
              <button
                onClick={generateReport}
                disabled={isGenerating}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <span>Generate Report</span>
                )}
              </button>
              <button
                onClick={clearFilters}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200"
              >
                Clear Filters
              </button>
            </div>
            {reportData && (
              <button
                onClick={exportToCSV}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg flex items-center space-x-2"
              >
                <span>📥</span>
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {reportData ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-blue-600 text-sm font-medium">Total Expenses</p>
                  <p className="text-2xl font-bold text-blue-700">{reportData.totals.totalExpenses}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-blue-600 text-sm font-medium">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatCurrency(reportData.totals.totalAmount)}
                  </p>
                </div>
                {Object.keys(reportData.totals.byType).length > 0 && (
                  <div className="col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-600 text-sm font-medium mb-2">By Type</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(reportData.totals.byType).map(([type, amount]) => (
                        <span
                          key={type}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                        >
                          {type}: {formatCurrency(amount)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Expenses Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Expense Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.expenses.length > 0 ? (
                        reportData.expenses.map((expense) => (
                          <tr key={expense.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {new Date(expense.date || expense.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {expense.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-blue-600">
                              {formatCurrency(expense.amount)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                              {expense.description || '—'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            No expenses found for the selected period and filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {reportData.expenses.length > 0 && (
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                            Total:
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-600 border-t">
                            {formatCurrency(reportData.totals.totalAmount)}
                          </td>
                          <td className="px-4 py-3 border-t"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Report Generated</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Use the filters above to generate an expense report for your desired period.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {reportData &&
                `Report period: ${new Date(reportData.period.startDate).toLocaleDateString()} - ${new Date(reportData.period.endDate).toLocaleDateString()}`}
            </p>
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
