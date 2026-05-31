import { Customer } from '@/types/customer';
import { useMemo } from 'react';

interface ReportDashboardProps {
  customers: Customer[];
}

export default function ReportDashboard({ customers }: ReportDashboardProps) {
  const reports = useMemo(() => {
    const total = customers.length;
    
    // Safe date filtering with null checks
    const active = customers.filter(c => {
      if (!c.isActive) return false;
      if (!c.expireDate) return true; // No expiry date means active
      const expireDate = c.expireDate instanceof Date ? c.expireDate : new Date(c.expireDate);
      return expireDate >= new Date();
    }).length;

    const expired = customers.filter(c => {
      if (!c.isActive) return true;
      if (!c.expireDate) return false; // No expiry date means not expired
      const expireDate = c.expireDate instanceof Date ? c.expireDate : new Date(c.expireDate);
      return expireDate < new Date();
    }).length;
    
    const expiringThisWeek = customers.filter(c => {
      if (!c.expireDate) return false;
      const expireDate = c.expireDate instanceof Date ? c.expireDate : new Date(c.expireDate);
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      return expireDate >= today && expireDate <= nextWeek;
    });

    const newThisMonth = customers.filter(c => {
      const registerDate = c.registerDate instanceof Date ? c.registerDate : new Date(c.registerDate);
      const today = new Date();
      return registerDate.getMonth() === today.getMonth() && registerDate.getFullYear() === today.getFullYear();
    });

    const revenue = customers.filter(c => c.isActive).length * 49.99; // Example monthly fee

    return {
      total,
      active,
      expired,
      expiringThisWeek: expiringThisWeek.length,
      newThisMonth: newThisMonth.length,
      revenue
    };
  }, [customers]);

  // Helper function to safely format dates (handles both string and Date objects)
  const safeFormatDate = (date: Date | string | null) => {
    if (!date) return 'No expiry';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString();
  };

  // Helper function to check if customer is expiring this week
  const isExpiringThisWeek = (customer: Customer) => {
    if (!customer.expireDate) return false;
    const expireDate = customer.expireDate instanceof Date ? customer.expireDate : new Date(customer.expireDate);
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return expireDate >= today && expireDate <= nextWeek;
  };

  // Helper function to check if customer is new this month
  const isNewThisMonth = (customer: Customer) => {
    const registerDate = customer.registerDate instanceof Date ? customer.registerDate : new Date(customer.registerDate);
    const today = new Date();
    return registerDate.getMonth() === today.getMonth() && registerDate.getFullYear() === today.getFullYear();
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-8 border border-white/20">
      <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
        📊 Membership Analytics Dashboard
        <span className="ml-3 text-sm bg-blue-500 text-white px-3 py-1 rounded-full">Live</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Key Metrics */}
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm font-medium">Total Members</p>
              <p className="text-3xl font-bold text-white mt-2">{reports.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-500/30">
            <p className="text-blue-200 text-sm">Active: <span className="text-green-400 font-semibold">{reports.active}</span></p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm font-medium">Monthly Revenue</p>
              <p className="text-3xl font-bold text-white mt-2">${reports.revenue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-green-500/30">
            <p className="text-green-200 text-sm">Active subscriptions</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-200 text-sm font-medium">Expired Members</p>
              <p className="text-3xl font-bold text-white mt-2">{reports.expired}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⏰</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-red-500/30">
            <p className="text-red-200 text-sm">Need renewal</p>
          </div>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            🚨 Expiring This Week
            <span className="ml-2 bg-orange-500 text-white px-2 py-1 rounded-full text-sm">
              {reports.expiringThisWeek}
            </span>
          </h3>
          <div className="space-y-3">
            {customers
              .filter(isExpiringThisWeek)
              .slice(0, 5)
              .map(customer => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{customer.name}</p>
                    <p className="text-gray-400 text-sm">{customer.phone}</p>
                  </div>
                  <span className="text-orange-400 text-sm font-semibold">
                    {safeFormatDate(customer.expireDate)}
                  </span>
                </div>
              ))}
            {reports.expiringThisWeek === 0 && (
              <p className="text-gray-400 text-center py-4">No memberships expiring this week</p>
            )}
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            🎉 New This Month
            <span className="ml-2 bg-green-500 text-white px-2 py-1 rounded-full text-sm">
              {reports.newThisMonth}
            </span>
          </h3>
          <div className="space-y-3">
            {customers
              .filter(isNewThisMonth)
              .slice(0, 5)
              .map(customer => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{customer.name}</p>
                    <p className="text-gray-400 text-sm">{customer.phone}</p>
                  </div>
                  <span className="text-green-400 text-sm font-semibold">
                    {safeFormatDate(customer.registerDate)}
                  </span>
                </div>
              ))}
            {reports.newThisMonth === 0 && (
              <p className="text-gray-400 text-center py-4">No new members this month</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Required */}
      <div className="mt-6 p-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl border border-orange-500/30">
        <h3 className="text-xl font-bold text-white mb-2">🚨 Immediate Attention Required</h3>
        <p className="text-orange-200">
          {reports.expired > 0 
            ? `You have ${reports.expired} expired memberships that need renewal to maintain revenue.`
            : 'All memberships are currently active. Great job!'
          }
        </p>
      </div>
    </div>
  );
}