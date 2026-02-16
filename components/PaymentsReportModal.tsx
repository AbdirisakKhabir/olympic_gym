'use client';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface Payment {
  id: number;
  customerId: number;
  paidAmount: number;
  discount: number;
  balance: number;
  date: string;
  customer: {
    id: number;
    name: string;
    phone: string | null;
    image: string | null;
  };
  user: {
    id: number;
    username: string;
    name: string | null;
  };
}

interface PaymentsReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportFilters {
  startDate: string;
  endDate: string;
  customerName: string;
  phone: string;
}

interface ReportData {
  payments: Payment[];
  totals: {
    totalPaid: number;
    totalDiscount: number;
    totalBalance: number;
    totalPayments: number;
    totalCustomers: number;
  };
  period: {
    startDate: string;
    endDate: string;
  };
}

export default function PaymentsReportModal({ isOpen, onClose }: PaymentsReportModalProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    customerName: '',
    phone: '',
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Set default dates to current month
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      setFilters(prev => ({
        ...prev,
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0],
      }));
    }
  }, [isOpen]);

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({
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
      const response = await fetch('/api/payments/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      Swal.fire({
        icon: 'error',
        title: 'Report Generation Failed',
        text: 'Failed to generate payments report. Please try again.',
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const headers = ['Date', 'Customer Name', 'Phone', 'Paid Amount', 'Discount', 'Balance', 'Processed By'];
    const csvData = reportData.payments.map(payment => [
      new Date(payment.date).toLocaleDateString(),
      payment.customer.name,
      payment.customer.phone || 'N/A',
      payment.paidAmount,
      payment.discount,
      payment.balance,
      payment.user.name || payment.user.username,
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-report-${filters.startDate}-to-${filters.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      customerName: '',
      phone: '',
    });
    setReportData(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="p-2 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Payments Report</h2>
              <p className="text-blue-100 mt-1">Generate detailed payments report for any period</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors duration-200 p-2 hover:bg-blue-700 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
              <input
                type="text"
                value={filters.customerName}
                onChange={(e) => handleFilterChange('customerName', e.target.value)}
                placeholder="Filter by name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="text"
                value={filters.phone}
                onChange={(e) => handleFilterChange('phone', e.target.value)}
                placeholder="Filter by phone..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
              />
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
                  <>
                   
                    <span>Generate Report</span>
                  </>
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
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-blue-600 text-sm font-medium">Total Payments</p>
                  <p className="text-2xl font-bold text-blue-700">{reportData.totals.totalPayments}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-blue-600 text-sm font-medium">Total Paid</p>
                  <p className="text-2xl font-bold text-blue-700">${reportData.totals.totalPaid.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-blue-600 text-sm font-medium">Total Discount</p>
                  <p className="text-2xl font-bold text-blue-700">${reportData.totals.totalDiscount.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-blue-600 text-sm font-medium">Total Balance</p>
                  <p className="text-2xl font-bold text-blue-700">${reportData.totals.totalBalance.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-blue-600 text-sm font-medium">Unique Customers</p>
                  <p className="text-2xl font-bold text-blue-700">{reportData.totals.totalCustomers}</p>
                </div>
              </div>

              {/* Payments Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Phone
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Paid Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Discount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Balance
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          Processed By
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.payments.length > 0 ? (
                        reportData.payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {new Date(payment.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {payment.customer.name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {payment.customer.phone || 'N/A'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 font-semibold">
                              ${payment.paidAmount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600">
                              ${payment.discount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600">
                              ${payment.balance.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {payment.user.name || payment.user.username}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            No payments found for the selected period and filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {/* Footer with totals */}
                    {reportData.payments.length > 0 && (
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                            Totals:
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-600 border-t">
                            ${reportData.totals.totalPaid.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-600 border-t">
                            ${reportData.totals.totalDiscount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-600 border-t">
                            ${reportData.totals.totalBalance.toFixed(2)}
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
                Use the filters above to generate a payments report for your desired period.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {reportData && `Report period: ${new Date(reportData.period.startDate).toLocaleDateString()} - ${new Date(reportData.period.endDate).toLocaleDateString()}`}
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