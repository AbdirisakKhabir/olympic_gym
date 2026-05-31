'use client';

import { Customer } from '@/types/customer';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import CustomerMembershipPrintSheet, {
  triggerMembershipPrint,
} from '@/components/CustomerMembershipPrintSheet';
import {
  AlertCircle,
  Banknote,
  Calendar,
  CalendarClock,
  Circle,
  Clock,
  Loader2,
  MessageCircle,
  Pencil,
  Phone,
  Printer,
  Trash2,
  User,
  X,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onEdit: (customer: Customer) => void;
  onClose: () => void;
  onDelete?: (customer: Customer) => void;
  onPaymentRecorded?: (customer: Customer) => void;
  customer: Customer | null;
  currentUserId?: string | null;
  /** Users with payments:create (e.g. staff) can record payments; when false, Record Payment is hidden */
  canAccessPayments?: boolean;
  /** Show balance owed and monthly fee in summary (e.g. staff with members:outstanding_balance) */
  canViewBalanceInfo?: boolean;
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
  canViewBalanceInfo = false,
}: CustomerDetailModalProps) {
  const [customerPayments, setCustomerPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [paymentAmountDue, setPaymentAmountDue] = useState('');
  const [paymentPaid, setPaymentPaid] = useState('');
  const [paymentDiscount, setPaymentDiscount] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [imageZoomOpen, setImageZoomOpen] = useState(false);
  const [imageZoomScale, setImageZoomScale] = useState(1);

  useEffect(() => {
    if (!canAccessPayments) {
      setCustomerPayments([]);
      return;
    }
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
  }, [customer, isOpen, canAccessPayments]);

  useEffect(() => {
    if (isOpen && customer) {
      const bal = Number(customer.balance ?? 0);
      setPaymentAmountDue(bal.toFixed(2));
      setPaymentPaid('');
      setPaymentDiscount('0');
    }
  }, [isOpen, customer?.id, customer?.balance]);

  useEffect(() => {
    if (!imageZoomOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setImageZoomOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [imageZoomOpen]);

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
      onClose();
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

  const StatusIcon = () => {
    const className = 'w-4 h-4 shrink-0';
    if (!expireDate) return <Circle className={className} aria-hidden />;
    if (isExpired) return <AlertCircle className={className} aria-hidden />;
    if (daysUntilExpiry != null && daysUntilExpiry <= 3) {
      return <AlertCircle className={className} aria-hidden />;
    }
    if (daysUntilExpiry != null && daysUntilExpiry <= 7) {
      return <Clock className={className} aria-hidden />;
    }
    return <CheckCircle2 className={className} aria-hidden />;
  };

  const footerBtn =
    'group min-h-[40px] rounded-lg text-sm font-semibold transition-all duration-200 touch-manipulation flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100';

  const footerIconWrap = (bg: string) =>
    `flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${bg}`;

  const sectionCard = 'rounded-xl p-3.5 sm:p-4';
  const sectionTitle = 'text-sm font-semibold text-gray-900 mb-2.5 flex items-center gap-1.5';

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
  const hasOutstandingBalance = Number(customer.balance ?? 0) > 0;
  const showFinancialOnPrint = canAccessPayments || canViewBalanceInfo;

  const handlePrintSummary = () => {
    triggerMembershipPrint();
  };

  const handleDelete = async () => {
    if (hasOutstandingBalance) {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot delete member',
        html: `<strong>${customer.name}</strong> has an outstanding balance of <strong>$${Number(customer.balance ?? 0).toFixed(2)}</strong>. Record payment or clear the balance before deleting.`,
        confirmButtonColor: '#2563eb',
      });
      return;
    }

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
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 backdrop-blur-sm overflow-y-auto overscroll-y-contain">
      <div className="bg-white rounded-2xl shadow-2xl w-full min-w-0 max-w-[min(42rem,calc(100vw-1rem))] max-h-[min(95vh,100dvh-1rem)] sm:max-h-[90vh] my-auto flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 p-3 sm:p-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold truncate">Member Details</h2>
              <p className="text-blue-100 mt-0.5 text-xs sm:text-sm">Complete customer information</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors p-2 rounded-full hover:bg-white/20"
              aria-label="Close"
            >
              <X className="w-6 h-6" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4 pb-2 flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {/* Customer Profile */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 mb-4">
            <button
              type="button"
              onClick={() => { setImageZoomOpen(true); setImageZoomScale(1); }}
              className="relative shrink-0 rounded-xl border-2 border-gray-200 shadow-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="View full size (zoom)"
            >
              <img
                src={customer.image || '/api/placeholder/200/200'}
                alt={customer.name}
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover block"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors text-white text-xs font-medium opacity-0 hover:opacity-100">
                Zoom
              </span>
            </button>
            <div className="flex-1 text-center sm:text-left w-full">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5 break-words">{customer.name}</h3>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 sm:gap-3 text-sm text-gray-600">
                <div className="flex items-center space-x-1.5">
                  <Phone className="w-4 h-4 text-gray-500 shrink-0" aria-hidden />
                  <span className="font-medium">{formatPhoneNumber(customer.phone)}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <User className="w-4 h-4 text-gray-500 shrink-0" aria-hidden />
                  <span className="font-medium capitalize">{customer.gender || 'Member'}</span>
                </div>
                {customer.shift && (
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-gray-500 shrink-0" aria-hidden />
                    <span className="font-medium">{customer.shift}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold ${getStatusColor()} mb-4`}>
            <StatusIcon />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className={`bg-gray-50 ${sectionCard}`}>
              <h4 className={sectionTitle}>
                <Calendar className="w-4 h-4 text-blue-500 shrink-0" aria-hidden />
                Registration Details
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-gray-600">Registration Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(registerDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Membership Duration</p>
                  <p className="font-semibold text-blue-600">{getMembershipDuration()}</p>
                </div>
              </div>
            </div>

            <div className={`bg-gray-50 ${sectionCard}`}>
              <h4 className={sectionTitle}>
                <CalendarClock className="w-4 h-4 text-red-500 shrink-0" aria-hidden />
                Expiry Details
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-gray-600">Expiry Date</p>
                  <p className="font-semibold text-gray-900">{formatExpireDate(customer.expireDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Status</p>
                  <p className={`font-semibold ${
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
            <div className={`bg-gray-50 ${sectionCard} mb-4`}>
              <h4 className={sectionTitle}>
                <Activity className="w-4 h-4 text-green-500 shrink-0" aria-hidden />
                Body Metrics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs sm:text-sm">
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
          <div className={`bg-blue-50 ${sectionCard}`}>
            <h4 className={`${sectionTitle} mb-2`}>Membership Summary</h4>
            <div className="grid grid-cols-2 gap-2.5 text-xs sm:text-sm">
              {(canAccessPayments || canViewBalanceInfo) && (
              <div>
                <p className="text-gray-600">Balance Owed</p>
                <p className={`font-semibold ${(customer.balance ?? 0) > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                  ${Number(customer.balance ?? 0).toFixed(2)}
                </p>
              </div>
              )}
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
              {(canAccessPayments || canViewBalanceInfo) && (
              <div>
                <p className="text-gray-600">Monthly Fee</p>
                <p className="font-semibold text-gray-900">${customer.fee || '0'}</p>
              </div>
              )}
            </div>
          </div>

          {/* Record Payment */}
          {canAccessPayments && (
          <div className={`mt-5 sm:mt-6 bg-gradient-to-br from-amber-50 via-amber-50/90 to-orange-50/60 border border-amber-200/90 ${sectionCard} shadow-sm`}>
            <h4 className={`${sectionTitle} mb-2`}>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <Banknote className="w-4 h-4" aria-hidden />
              </span>
              Record Payment
            </h4>
            <div className="mb-3 p-2.5 rounded-lg bg-white border border-amber-200">
              <p className="text-xs font-medium text-gray-600">Current balance (owed)</p>
              <p className="text-base font-bold text-amber-700">${Number(customer.balance ?? 0).toFixed(2)}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Amount due ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentAmountDue}
                  onChange={(e) => setPaymentAmountDue(e.target.value)}
                  disabled={isSubmittingPayment}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Amount paid ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentPaid}
                  onChange={(e) => setPaymentPaid(e.target.value)}
                  disabled={isSubmittingPayment}
                  placeholder="0.00"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Discount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentDiscount}
                  onChange={(e) => setPaymentDiscount(e.target.value)}
                  disabled={isSubmittingPayment}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">New balance</label>
                <p className="px-2.5 py-1.5 text-sm rounded-lg bg-white border border-gray-200 font-semibold text-gray-900">
                  ${calculatedNewBalance.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleRecordPayment}
                disabled={isSubmittingPayment || paidNum <= 0}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg font-semibold shadow-sm shadow-green-600/20 hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
              >
                {isSubmittingPayment ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                ) : (
                  <Banknote className="w-4 h-4" aria-hidden />
                )}
                {isSubmittingPayment ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
          )}
        </div>

        {/* Footer actions — spaced from scroll content / payment card */}
        <div className="shrink-0 mt-4 sm:mt-5 border-t border-gray-200/90 p-3 sm:p-4 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-b from-slate-50 to-white shadow-[0_-6px_20px_-10px_rgba(15,23,42,0.1)]">
          <div className="flex flex-col gap-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={handlePrintSummary}
                disabled={isDeleting}
                className={`${footerBtn} w-full px-3 py-2 border border-indigo-200/80 bg-white text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300`}
              >
                <span className={footerIconWrap('bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200')}>
                  <Printer className="w-4 h-4" strokeWidth={2} aria-hidden />
                </span>
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className={`${footerBtn} w-full px-3 py-2 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300`}
              >
                <span className={footerIconWrap('bg-gray-100 text-gray-600 group-hover:bg-gray-200')}>
                  <X className="w-4 h-4" strokeWidth={2} aria-hidden />
                </span>
                <span>Close</span>
              </button>
              <button
                type="button"
                onClick={handleWhatsAppClick}
                disabled={isWhatsAppDisabled || isDeleting}
                className={`${footerBtn} w-full px-3 py-2 ${
                  isWhatsAppDisabled || isDeleting
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md shadow-green-600/20 hover:from-emerald-600 hover:to-green-700 hover:shadow-lg'
                }`}
              >
                <span
                  className={footerIconWrap(
                    isWhatsAppDisabled || isDeleting
                      ? 'bg-gray-300/50 text-gray-400'
                      : 'bg-white/20 text-white'
                  )}
                >
                  <MessageCircle className="w-4 h-4" strokeWidth={2} aria-hidden />
                </span>
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onEdit(customer);
                  onClose();
                }}
                disabled={isDeleting}
                className={`${footerBtn} w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/20 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg`}
              >
                <span className={footerIconWrap('bg-white/20 text-white')}>
                  <Pencil className="w-4 h-4" strokeWidth={2} aria-hidden />
                </span>
                <span>Edit</span>
              </button>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || hasOutstandingBalance}
              title={
                hasOutstandingBalance
                  ? `Clear outstanding balance ($${Number(customer.balance ?? 0).toFixed(2)}) before deleting`
                  : 'Delete member'
              }
              className={`${footerBtn} w-full px-3 py-2 ${
                hasOutstandingBalance
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md shadow-red-600/20 hover:from-red-600 hover:to-rose-700 hover:shadow-lg'
              }`}
            >
              {isDeleting ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
              ) : (
                <span
                  className={footerIconWrap(
                    hasOutstandingBalance ? 'bg-gray-400/40 text-gray-500' : 'bg-white/20 text-white'
                  )}
                >
                  <Trash2 className="w-4 h-4" strokeWidth={2} aria-hidden />
                </span>
              )}
              <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Image Zoom Overlay */}
    {imageZoomOpen && customer && (
      <div
        className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-4 overflow-hidden"
        onClick={() => setImageZoomOpen(false)}
        role="dialog"
        aria-modal="true"
        aria-label="Image zoom"
      >
        <div
          className="relative max-w-full max-h-full flex items-center justify-center overflow-auto"
          onClick={(e) => e.stopPropagation()}
          onWheel={(e) => {
            e.preventDefault();
            if (e.deltaY < 0) setImageZoomScale((s) => Math.min(3, s + 0.15));
            else setImageZoomScale((s) => Math.max(0.5, s - 0.15));
          }}
        >
          <img
            src={customer.image || '/api/placeholder/200/200'}
            alt={customer.name}
            className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg shadow-2xl transition-transform duration-200"
            style={{ transform: `scale(${imageZoomScale})` }}
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-4">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setImageZoomScale((s) => Math.max(0.5, s - 0.25)); }}
            className="px-4 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-xl font-semibold shadow-lg transition-colors"
          >
            Zoom Out
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setImageZoomScale((s) => Math.min(3, s + 0.25)); }}
            className="px-4 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-xl font-semibold shadow-lg transition-colors"
          >
            Zoom In
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setImageZoomScale(1); }}
            className="px-4 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-xl font-semibold shadow-lg transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setImageZoomOpen(false)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold shadow-lg transition-colors"
          >
            Close
          </button>
        </div>
        <p className="text-white/80 text-sm mt-2">Click outside or Close to exit</p>
      </div>
    )}
    <CustomerMembershipPrintSheet
      customer={customer}
      showFinancialInfo={showFinancialOnPrint}
    />
    </>
  );
}