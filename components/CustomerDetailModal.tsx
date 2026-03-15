'use client';

import { Customer } from '@/types/customer';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onEdit: (customer: Customer) => void;
  onClose: () => void;
  onDelete?: (customer: Customer) => void;
  onPaymentRecorded?: (customer: Customer) => void;
  customer: Customer | null;
  currentUserId?: string | null;
  /** Only admin can record payments; when false, Record Payment section is hidden */
  canAccessPayments?: boolean;
}

// Define Payment type since you're using it
interface Payment {
  id: string;
  paidAmount: number;
  date: string;
  discount: number;
  balance: number;
}

export default function CustomerDetailModal({ 
  isOpen, 
  onClose, 
  customer, 
  onEdit,
  onDelete,
  onPaymentRecorded,
  currentUserId,
  canAccessPayments = true,
}: CustomerDetailModalProps) {
  const [customerPayments, setCustomerPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [paymentAmountDue, setPaymentAmountDue] = useState('');
  const [paymentPaid, setPaymentPaid] = useState('');
  const [paymentDiscount, setPaymentDiscount] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      if (customer && isOpen) {
        setLoadingPayments(true);
        try {
          const response = await fetch(`/api/customers/${customer.id}/payments`);
          if (response.ok) {
            const payments = await response.json();
            setCustomerPayments(payments);
          }
        } catch (error) {
          console.error('Error fetching payments:', error);
        } finally {
          setLoadingPayments(false);
        }
      }
    };

    fetchPayments();
  }, [customer, isOpen]);

  useEffect(() => {
    if (isOpen && customer) {
      const bal = Number(customer.balance ?? 0);
      setPaymentAmountDue(bal.toFixed(2));
      setPaymentPaid('');
      setPaymentDiscount('0');
    }
  }, [isOpen, customer?.id, customer?.balance]);

  // ✅ MOVED: Conditional return to the END, after all hooks
  if (!isOpen || !customer) return null;

  const amountDueNum = parseFloat(paymentAmountDue) || 0;
  const paidNum = parseFloat(paymentPaid) || 0;
  const discountNum = parseFloat(paymentDiscount) || 0;
  const calculatedNewBalance = Math.max(0, amountDueNum - paidNum - discountNum);

  const handleRecordPayment = async () => {
    if (paidNum <= 0) {
      Swal.fire({ icon: 'warning', title: 'Invalid amount', text: 'Paid amount must be greater than 0.', timer: 2500, showConfirmButton: false });
      return;
    }
    if (!currentUserId) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'You must be logged in to record a payment.', timer: 2500, showConfirmButton: false });
      return;
    }
    setIsSubmittingPayment(true);
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          userId: currentUserId,
          paidAmount: paidNum,
          discount: discountNum,
          amountDue: amountDueNum,
          date: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to record payment');
      }
      const data = await res.json();
      if (data.customer) {
        onPaymentRecorded?.({ ...customer, balance: data.customer.balance } as Customer);
      }
      setPaymentAmountDue(calculatedNewBalance.toFixed(2));
      setPaymentPaid('');
      setPaymentDiscount('0');
      const paymentRecord = data.payment;
      if (paymentRecord) {
        setCustomerPayments(prev => [{
          id: String(paymentRecord.id),
          paidAmount: paymentRecord.paidAmount ?? paidNum,
          date: paymentRecord.date ?? new Date().toISOString(),
          discount: paymentRecord.discount ?? discountNum,
          balance: paymentRecord.balance ?? calculatedNewBalance,
        }, ...prev]);
      }
      Swal.fire({ icon: 'success', title: 'Payment recorded', text: `New balance: $${calculatedNewBalance.toFixed(2)}`, timer: 2000, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Failed', text: e instanceof Error ? e.message : 'Could not record payment.', timer: 3000, showConfirmButton: false });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Safe date parsing with null checks
  const expireDate = customer.expireDate ? new Date(customer.expireDate) : null;
  const registerDate = new Date(customer.registerDate);
  const isExpired = expireDate ? expireDate < new Date() : false;
  const daysUntilExpiry = expireDate 
    ? Math.ceil((expireDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const getStatusColor = () => {
    if (!expireDate) return 'bg-gray-500 text-white';
    if (isExpired) return 'bg-red-500 text-white';
    if (daysUntilExpiry && daysUntilExpiry <= 3) return 'bg-orange-500 text-white';
    if (daysUntilExpiry && daysUntilExpiry <= 7) return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white';
  };

  const getStatusText = () => {
    if (!expireDate) return 'No Expiry Date';
    if (isExpired) return 'Membership Expired';
    if (daysUntilExpiry === 0) return 'Expires Today';
    if (daysUntilExpiry === 1) return '1 Day Left';
    return `${daysUntilExpiry} Days Left`;
  };

  const getStatusIcon = () => {
    if (!expireDate) return '⚫';
    if (isExpired) return '🔴';
    if (daysUntilExpiry && daysUntilExpiry <= 3) return '🟠';
    if (daysUntilExpiry && daysUntilExpiry <= 7) return '🟡';
    return '🟢';
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatExpireDate = (date: Date | string | null) => {
    if (!date) return 'No expiry date set';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return 'No phone number';
    return phone;
  };

  const getMembershipDuration = () => {
    const now = new Date();
    const months = (now.getFullYear() - registerDate.getFullYear()) * 12 + (now.getMonth() - registerDate.getMonth());
    return months > 0 ? `${months} month${months > 1 ? 's' : ''}` : 'New Member';
  };

  const handleWhatsAppClick = () => {
    if (!customer.phone) {
      alert('No phone number available for this customer.');
      return;
    }

    // Clean phone number (remove any non-digit characters)
    const cleanPhone = customer.phone.replace(/\D/g, '');
    
    let message;
    if (!expireDate || isExpired) {
      message = `Hello ${customer.name}, your gym membership needs attention. Please contact us for more information. Thank you for being a valued member!`;
    } else {
      message = `Hello ${customer.name}, your gym membership expires on ${formatExpireDate(customer.expireDate)}. Please renew to continue enjoying our services!`;
    }
    
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const isWhatsAppDisabled = !customer.phone;

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Delete member?',
      html: `Remove <strong>${customer.name}</strong>? This will also delete all their payment records. This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
    });
    if (!result.isConfirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/customer/${customer.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete member');
      }
      onDelete?.(customer);
      onClose();
      Swal.fire({
        icon: 'success',
        title: 'Member deleted',
        text: `${customer.name} has been removed.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Delete failed',
        text: e instanceof Error ? e.message : 'Could not delete member. Try again.',
        confirmButtonColor: '#2563eb',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-3xl font-bold truncate">Member Details</h2>
              <p className="text-blue-100 mt-1 sm:mt-2 text-sm sm:text-base">Complete customer information</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors p-2 rounded-full hover:bg-white/20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
          {/* Customer Profile */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6">
            <img
              src={customer.image || '/api/placeholder/200/200'}
              alt={customer.name}
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-2xl object-cover border-4 border-gray-200 shadow-lg shrink-0"
            />
            <div className="flex-1 text-center sm:text-left w-full">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 break-words">{customer.name}</h3>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 sm:gap-4 text-gray-600">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span className="font-medium">{formatPhoneNumber(customer.phone)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium capitalize">{customer.gender || 'Member'}</span>
                </div>
                {customer.shift && (
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{customer.shift}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-base sm:text-lg font-semibold ${getStatusColor()} mb-6`}>
            <span className="mr-2 text-xl">
              {getStatusIcon()}
            </span>
            {getStatusText()}
          </div>

          {/* Payment History Section
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h4>
            {loadingPayments ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading payments...</p>
              </div>
            ) : customerPayments.length > 0 ? (
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="space-y-3">
                  {customerPayments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <div>
                        <p className="font-semibold">${payment.paidAmount}</p>
                        <p className="text-sm text-gray-500">{new Date(payment.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Balance: ${payment.balance}</p>
                        {payment.discount > 0 && (
                          <p className="text-sm text-green-600">Discount: ${payment.discount}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-6 text-center">
                <p className="text-gray-500">No payment history available</p>
              </div>
            )}
          </div> */}

          {/* Detailed Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Registration Details
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Registration Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(registerDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Membership Duration</p>
                  <p className="text-lg font-semibold text-blue-600">{getMembershipDuration()}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Expiry Details
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Expiry Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatExpireDate(customer.expireDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`text-lg font-semibold ${
                    !expireDate ? 'text-gray-600' : isExpired ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {!expireDate ? 'No Expiry' : isExpired ? 'Expired' : 'Active'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Body Metrics - only show if any value exists */}
          {(customer.height != null || customer.weight != null || customer.bmi != null || customer.standardWeight != null) && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z" clipRule="evenodd" />
                </svg>
                Body Metrics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {customer.height != null && (
                  <div>
                    <p className="text-gray-600">Height</p>
                    <p className="font-semibold text-gray-900">{Number(customer.height).toFixed(1)} cm</p>
                  </div>
                )}
                {customer.weight != null && (
                  <div>
                    <p className="text-gray-600">Weight</p>
                    <p className="font-semibold text-gray-900">{Number(customer.weight).toFixed(1)} kg</p>
                  </div>
                )}
                {customer.bmi != null && (
                  <div>
                    <p className="text-gray-600">BMI</p>
                    <p className="font-semibold text-gray-900">{Number(customer.bmi).toFixed(2)}</p>
                  </div>
                )}
                {customer.standardWeight != null && (
                  <div>
                    <p className="text-gray-600">Standard Weight</p>
                    <p className="font-semibold text-gray-900">{Number(customer.standardWeight).toFixed(1)} kg</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="bg-blue-50 rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Membership Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Balance Owed</p>
                <p className={`text-lg font-semibold ${(customer.balance ?? 0) > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                  ${Number(customer.balance ?? 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Member ID</p>
                <p className="font-semibold text-gray-900">{customer.id}</p>
              </div>
              <div>
                <p className="text-gray-600">Phone Verified</p>
                <p className={`font-semibold ${customer.phone ? 'text-green-600' : 'text-red-600'}`}>
                  {customer.phone ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Account Status</p>
                <p className={`font-semibold ${customer.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Monthly Fee</p>
                <p className="font-semibold text-gray-900">${customer.fee || '0'}</p>
              </div>
            </div>
          </div>

          {/* Record Payment - balance calculation (admin only) */}
          {canAccessPayments && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">💵</span>
              Record Payment
            </h4>
            {/* Existing balance - always visible */}
            <div className="mb-4 p-3 rounded-lg bg-white border border-amber-200">
              <p className="text-sm font-medium text-gray-600">Current balance (owed)</p>
              <p className="text-xl font-bold text-amber-700">${Number(customer.balance ?? 0).toFixed(2)}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount due ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentAmountDue}
                  onChange={(e) => setPaymentAmountDue(e.target.value)}
                  disabled={isSubmittingPayment}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount paid ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentPaid}
                  onChange={(e) => setPaymentPaid(e.target.value)}
                  disabled={isSubmittingPayment}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentDiscount}
                  onChange={(e) => setPaymentDiscount(e.target.value)}
                  disabled={isSubmittingPayment}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New balance (after payment)</label>
                <p className="px-3 py-2 rounded-lg bg-white border border-gray-200 font-semibold text-gray-900">
                  ${calculatedNewBalance.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleRecordPayment}
                disabled={isSubmittingPayment || paidNum <= 0}
                className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingPayment ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 sm:px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all duration-200 font-semibold disabled:opacity-50"
            >
              Close
            </button>
            <button
              onClick={handleWhatsAppClick}
              disabled={isWhatsAppDisabled || isDeleting}
              className={`flex-1 px-4 sm:px-6 py-3 rounded-xl transition-all duration-200 font-semibold flex items-center justify-center space-x-2 ${
                isWhatsAppDisabled || isDeleting
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              <span>💬</span>
              <span>{isWhatsAppDisabled ? 'No Phone Number' : 'Send WhatsApp'}</span>
            </button>
            <button
              onClick={() => {
                onEdit(customer);
                onClose();
              }}
              disabled={isDeleting}
              className="flex-1 px-4 sm:px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-semibold flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Customer</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-4 sm:px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 font-semibold flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>{isDeleting ? 'Deleting...' : 'Delete Member'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}