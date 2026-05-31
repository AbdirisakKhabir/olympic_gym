import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { 
  CreditCard, 
  X, 
  Filter,
  DollarSign,
  User,
  Calendar,
  Ban,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Update the interface to match your API response
interface Payment {
  id: number;
  customerId: number;
  userId: number;
  paidAmount: number;
  discount: number;
  balance: number;
  date: string;
  status?: 'completed' | 'cancelled' | 'refunded';
  cancelledAt?: string;
  reason?: string;
  paymentMethod?: string;
  customer: {
    name: string;
    phone: string;
  };
  user: {
    username: string;
  };
}

interface PaymentsListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentsListModal({ isOpen, onClose }: PaymentsListModalProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    if (isOpen) {
      fetchPayments();
    }
  }, [isOpen]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/payments');
      
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      
      const paymentsData = await response.json();
      console.log('Fetched payments:', paymentsData);
      setPayments(paymentsData);
      setCurrentPage(1); // Reset to first page when data changes
    } catch (error) {
      console.error('Error fetching payments:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load payments. Please try again.',
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPayment = async (paymentId: number, customerName: string) => {
    const { value: reason } = await Swal.fire({
      title: `Cancel Payment for ${customerName}`,
      input: 'text',
      inputLabel: 'Cancellation Reason',
      inputPlaceholder: 'Enter reason for cancellation...',
      inputAttributes: {
        maxlength: '200'
      },
      showCancelButton: true,
      confirmButtonText: 'Cancel Payment',
      cancelButtonText: 'Keep Payment',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      inputValidator: (value) => {
        if (!value) {
          return 'Please enter a cancellation reason';
        }
      }
    });

    if (reason) {
      try {
        setCancellingId(paymentId);
        const response = await fetch(`/api/payments/${paymentId}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: reason,
            cancelledBy: 1 // Replace with actual user ID from your auth system
          }),
        });

        if (response.ok) {
          await fetchPayments();
          
          Swal.fire({
            icon: 'success',
            title: 'Payment Cancelled',
            text: `Payment for ${customerName} has been cancelled successfully.`,
            timer: 3000,
            showConfirmButton: false,
          });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error);
        }
      } catch (error) {
        console.error('Error cancelling payment:', error);
        Swal.fire({
          icon: 'error',
          title: 'Cancellation Failed',
          text: error instanceof Error ? error.message : 'Failed to cancel payment',
          timer: 3000,
          showConfirmButton: false,
        });
      } finally {
        setCancellingId(null);
      }
    }
  };

  // Pagination logic
  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    return payment.status === filter;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayments = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const getStatusBadge = (status: string = 'completed') => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentMethodBadge = (method?: string) => {
    switch (method?.toLowerCase()) {
      case 'cash':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'card':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'bank transfer':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'mobile payment':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = {
    total: payments.length,
    completed: payments.filter(p => !p.status || p.status === 'completed').length,
    cancelled: payments.filter(p => p.status === 'cancelled').length,
    totalAmount: payments.filter(p => !p.status || p.status === 'completed').reduce((sum, p) => sum + p.paidAmount, 0)
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="p-2 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Payments List</h2>
              <p className="text-blue-100 mt-1">Manage and view all payment transactions</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors duration-200 p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Stats and Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(stats.totalAmount)}</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              {/* <button
                onClick={() => { setFilter('all'); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 border flex items-center gap-2 ${
                  filter === 'all'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                }`}
              >
                <Filter className="w-4 h-4" />
                All
              </button>
              <button
                onClick={() => { setFilter('completed'); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 border ${
                  filter === 'completed'
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => { setFilter('cancelled'); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 border ${
                  filter === 'cancelled'
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-red-300'
                }`}
              >
                Cancelled
              </button> */}
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
          ) : currentPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Payments Found</h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'There are no payments recorded yet.' 
                  : `No ${filter} payments found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Payment Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 flex-1">
                      <div>
                        <p className="text-sm text-gray-600 font-medium flex items-center gap-1">
                          <User className="w-4 h-4" />
                          Customer
                        </p>
                        <p className="font-semibold text-gray-900">{payment.customer.name}</p>
                        <p className="text-sm text-gray-500">{payment.customer.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          Amount
                        </p>
                        <p className="font-semibold text-green-600 text-lg">
                          {formatCurrency(payment.paidAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Date
                        </p>
                        <p className="font-semibold text-gray-900">{formatDate(payment.date)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Status</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(payment.status)}`}>
                          {payment.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : 'Completed'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Processed By</p>
                        <p className="font-semibold text-gray-900">{payment.user.username}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    {/* <div className="flex gap-2">
                      {payment.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancelPayment(payment.id, payment.customer.name)}
                          disabled={cancellingId === payment.id}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                        >
                          {cancellingId === payment.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Cancelling...</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-4 h-4" />
                              <span>Cancel</span>
                            </>
                          )}
                        </button>
                      )}
                    </div> */}
                  </div>

                  {/* Additional Information */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {payment.discount > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Discount</p>
                        <p className="text-sm text-orange-600 font-semibold">{formatCurrency(payment.discount)}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Balance</p>
                      <p className="text-sm text-gray-700 font-semibold">{formatCurrency(payment.balance)}</p>
                    </div>

                    {payment.paymentMethod && (
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Payment Method</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentMethodBadge(payment.paymentMethod)}`}>
                          {payment.paymentMethod}
                        </span>
                      </div>
                    )}

                    {/* Cancellation Details */}
                    {payment.status === 'cancelled' && payment.reason && (
                      <div className="md:col-span-3">
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-sm text-red-700">
                            <span className="font-semibold">Cancellation Reason:</span> {payment.reason}
                          </p>
                          {payment.cancelledAt && (
                            <p className="text-xs text-red-600 mt-1">
                              Cancelled on: {formatDate(payment.cancelledAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
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
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPayments.length)} of {filteredPayments.length} payments
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
                        ? 'bg-blue-500 text-white'
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
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{currentPayments.length}</span> of <span className="font-semibold">{filteredPayments.length}</span> payments
            </div>
            <button
              onClick={onClose}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}