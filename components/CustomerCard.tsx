'use client';

import { Customer } from '@/types/customer';
import { useState, useEffect } from 'react';

interface CustomerCardProps {
  customer: Customer;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onClick: (customer: Customer) => void;
}

export default function CustomerCard({ customer, isSelected, onSelect, onClick }: CustomerCardProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Safe date parsing with null checks
  const expireDate = customer.expireDate ? new Date(customer.expireDate) : null;
  const registerDate = new Date(customer.registerDate);
  const isExpired = expireDate ? expireDate < new Date() : false;
  const daysUntilExpiry = expireDate 
    ? Math.ceil((expireDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (!isClient) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 animate-pulse">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (!expireDate) return 'bg-gray-500 text-white';
    if (isExpired) return 'bg-red-500 text-white';
    if (daysUntilExpiry && daysUntilExpiry <= 3) return 'bg-orange-500 text-white';
    if (daysUntilExpiry && daysUntilExpiry <= 7) return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white';
  };

  const getStatusText = () => {
    if (!expireDate) return 'No Expiry Date';
    if (isExpired) return 'Expired';
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
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}-${month}-${year}`;
  };

  const formatExpireDate = (date: Date | string | null) => {
    if (!date) return 'No expiry date set';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}-${month}-${year}`;
  };

  const getMembershipDuration = () => {
    const now = new Date();
    const months = (now.getFullYear() - registerDate.getFullYear()) * 12 + (now.getMonth() - registerDate.getMonth());
    return months > 0 ? `${months} month${months > 1 ? 's' : ''}` : 'New Member';
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click when checkbox is clicked
    if ((e.target as HTMLElement).closest('button, input')) {
      return;
    }
    onClick(customer);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(e);
  };

  return (
    <div 
      className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl cursor-pointer relative ${
        isSelected 
          ? 'border-blue-500 ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={handleCardClick}
    >
      
      {/* Selection Checkbox - Now Visible */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={handleCheckboxClick}
          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shadow-sm ${
            isSelected 
              ? 'bg-blue-500 border-blue-500 shadow-md' 
              : 'bg-white border-gray-400 hover:border-blue-500 hover:bg-blue-50'
          }`}
        >
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Customer Image and Main Info */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative">
            <img
              src={customer.image || '/api/placeholder/80/80'}
              alt={customer.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-gray-200 flex-shrink-0"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{customer.name}</h3>
            <div className="flex items-center mt-1 space-x-2">
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <p className="text-gray-600 text-sm font-medium">{customer.phone}</p>
            </div>
          </div>
        </div>

        {/* Status & Shift Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor()}`}>
            <span className="mr-2">{getStatusIcon()}</span>
            {getStatusText()}
          </div>
          {customer.shift && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800">
              {customer.shift}
            </span>
          )}
        </div>

        {/* Dates Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Registered:</span>
            </div>
            <p className="text-sm text-gray-900 font-semibold">
              {formatDate(registerDate)}
            </p>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Expires:</span>
            </div>
            <p className="text-sm text-gray-900 font-semibold">
              {formatExpireDate(customer.expireDate)}
            </p>
          </div>

          {/* Membership Duration */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <span className="text-xs font-medium text-gray-500">Membership:</span>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              {getMembershipDuration()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}