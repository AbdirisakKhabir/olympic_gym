'use client';

import { Customer } from '@/types/customer';

interface CustomerMembershipPrintSheetProps {
  customer: Customer;
  showFinancialInfo?: boolean;
}

function formatShortDate(date: Date | string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function membershipDuration(registerDate: Date | string) {
  const reg = new Date(registerDate);
  const now = new Date();
  const months =
    (now.getFullYear() - reg.getFullYear()) * 12 +
    (now.getMonth() - reg.getMonth());
  return months > 0 ? `${months} mo` : 'New';
}

function membershipStatus(customer: Customer) {
  const expireDate = customer.expireDate ? new Date(customer.expireDate) : null;
  if (!expireDate) return 'No expiry';
  if (expireDate < new Date()) return 'Expired';
  return 'Active';
}

function bodyMetricsLine(customer: Customer): string | null {
  const parts: string[] = [];
  if (customer.height != null) parts.push(`${Number(customer.height).toFixed(1)} cm`);
  if (customer.weight != null) parts.push(`${Number(customer.weight).toFixed(1)} kg`);
  if (customer.bmi != null) parts.push(`BMI ${Number(customer.bmi).toFixed(2)}`);
  if (customer.standardWeight != null) {
    parts.push(`Std ${Number(customer.standardWeight).toFixed(1)} kg`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

export default function CustomerMembershipPrintSheet({
  customer,
  showFinancialInfo = false,
}: CustomerMembershipPrintSheetProps) {
  const expireDate = customer.expireDate ? new Date(customer.expireDate) : null;
  const isExpired = expireDate ? expireDate < new Date() : false;
  const daysLeft = expireDate
    ? Math.ceil((expireDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const statusLabel = (() => {
    if (!expireDate) return 'No expiry date';
    if (isExpired) return 'Expired';
    if (daysLeft === 0) return 'Expires today';
    if (daysLeft === 1) return '1 day left';
    return `${daysLeft} days left`;
  })();

  const metricsLine = bodyMetricsLine(customer);

  return (
    <div className="membership-print-sheet" aria-hidden="true">
      <div className="membership-print-inner">
        <header className="membership-print-header">
          <img src="/logo.jpg" alt="" className="membership-print-logo" />
          <div className="membership-print-header-text">
            <h1>Olympic Gym</h1>
            <p>Membership Summary</p>
          </div>
        </header>

        <section className="membership-print-profile">
          <img
            src={customer.image || '/api/placeholder/120/120'}
            alt=""
            className="membership-print-photo"
          />
          <div className="membership-print-profile-text">
            <h2>{customer.name}</h2>
            <dl>
              <div>
                <dt>ID</dt>
                <dd>{customer.id}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{customer.phone || '—'}</dd>
              </div>
              <div>
                <dt>Gender</dt>
                <dd className="capitalize">{customer.gender || '—'}</dd>
              </div>
              {customer.shift && (
                <div>
                  <dt>Shift</dt>
                  <dd>{customer.shift}</dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        <p className={`membership-print-status ${isExpired ? 'is-expired' : ''}`}>
          {statusLabel}
        </p>

        <table className="membership-print-table">
          <tbody>
            <tr>
              <th>Registered</th>
              <td>{formatShortDate(customer.registerDate)}</td>
            </tr>
            <tr>
              <th>Expires</th>
              <td>{formatShortDate(customer.expireDate)}</td>
            </tr>
            <tr>
              <th>Duration</th>
              <td>{membershipDuration(customer.registerDate)}</td>
            </tr>
            <tr>
              <th>Account</th>
              <td>{customer.isActive ? 'Active' : 'Inactive'}</td>
            </tr>
            <tr>
              <th>Membership</th>
              <td>{membershipStatus(customer)}</td>
            </tr>
            {showFinancialInfo && (
              <>
                <tr>
                  <th>Monthly fee</th>
                  <td>${Number(customer.fee ?? 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <th>Balance owed</th>
                  <td>${Number(customer.balance ?? 0).toFixed(2)}</td>
                </tr>
              </>
            )}
            {metricsLine && (
              <tr>
                <th>Body metrics</th>
                <td>{metricsLine}</td>
              </tr>
            )}
          </tbody>
        </table>

        <footer className="membership-print-footer">
          Printed {new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
        </footer>
      </div>
    </div>
  );
}

export function triggerMembershipPrint() {
  document.body.classList.add('printing-membership');
  const cleanup = () => {
    document.body.classList.remove('printing-membership');
  };
  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
}
