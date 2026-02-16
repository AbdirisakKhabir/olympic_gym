'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { X, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface IncomeStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportData {
  revenue: {
    total: number;
    paymentCount: number;
    payments: { id: number; paidAmount: number; date: string; customer: { name: string } }[];
  };
  expenses: {
    total: number;
    expenseCount: number;
    byType: Record<string, number>;
    expenses: { id: number; type: string; amount: number; date: string; description: string | null }[];
  };
  netIncome: number;
  period: { startDate: string; endDate: string };
}

export default function IncomeStatementModal({ isOpen, onClose }: IncomeStatementModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const generateReport = async () => {
    if (!startDate || !endDate) {
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
      const response = await fetch('/api/reports/income-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      });

      if (!response.ok) throw new Error('Failed to generate report');
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error generating income statement:', error);
      Swal.fire({
        icon: 'error',
        title: 'Report Generation Failed',
        text: 'Failed to generate income statement. Please try again.',
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const lines: string[] = [
      'Income Statement',
      `Period: ${new Date(reportData.period.startDate).toLocaleDateString()} - ${new Date(reportData.period.endDate).toLocaleDateString()}`,
      '',
      'REVENUE',
      `Total Revenue,${reportData.revenue.total.toFixed(2)}`,
      `Payment Count,${reportData.revenue.paymentCount}`,
      '',
      'EXPENSES',
      `Total Expenses,${reportData.expenses.total.toFixed(2)}`,
      `Expense Count,${reportData.expenses.expenseCount}`,
      '',
      'NET INCOME',
      `Net Income,${reportData.netIncome.toFixed(2)}`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income-statement-${startDate}-to-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Income Statement</h2>
              <p className="text-blue-100 mt-1">Revenue, expenses, and net income for a period</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>
            <button
              onClick={generateReport}
              disabled={isGenerating}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  Generate Report
                </>
              )}
            </button>
            {reportData && (
              <button
                onClick={exportToCSV}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
              >
                <span>📥</span>
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="p-6 overflow-y-auto max-h-[55vh]">
          {reportData ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <p className="text-blue-600 font-medium">Total Revenue</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(reportData.revenue.total)}</p>
                  <p className="text-sm text-blue-600 mt-1">{reportData.revenue.paymentCount} payments</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-blue-600" />
                    <p className="text-blue-600 font-medium">Total Expenses</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(reportData.expenses.total)}</p>
                  <p className="text-sm text-blue-600 mt-1">{reportData.expenses.expenseCount} expenses</p>
                </div>
                <div className={`rounded-xl p-6 border ${reportData.netIncome >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                  <p className="text-blue-600 font-medium mb-2">Net Income</p>
                  <p className={`text-2xl font-bold ${reportData.netIncome >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                    {formatCurrency(reportData.netIncome)}
                  </p>
                </div>
              </div>

              {/* Breakdown by Type */}
              {Object.keys(reportData.expenses.byType).length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Expenses by Type</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(reportData.expenses.byType).map(([type, amount]) => (
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
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Report Generated</h3>
              <p className="text-gray-500">Select start and end dates, then click Generate Report.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {reportData &&
                `Period: ${new Date(reportData.period.startDate).toLocaleDateString()} - ${new Date(reportData.period.endDate).toLocaleDateString()}`}
            </p>
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
