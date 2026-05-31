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
  return months > 0 ? `${months} month${months > 1 ? 's' : ''}` : 'New Member';
}

function membershipStatus(customer: Customer) {
  const expireDate = customer.expireDate ? new Date(customer.expireDate) : null;
  if (!expireDate) return 'No expiry date';
  if (expireDate < new Date()) return 'Expired';
  return 'Active';
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
    if (!expireDate) return 'No expiry date set';
    if (isExpired) return 'Membership expired';
    if (daysLeft === 0) return 'Expires today';
    if (daysLeft === 1) return '1 day remaining';
    return `${daysLeft} days remaining`;
  })();

  const hasBodyMetrics =
    customer.height != null ||
    customer.weight != null ||
    customer.bmi != null ||
    customer.standardWeight != null;

  return (
    <div className="membership-print-sheet" aria-hidden="true">
      <div className="membership-print-inner">
        <header className="membership-print-header">
          <img src="/logo.jpg" alt="" className="membership-print-logo" />
          <div className="membership-print-header-text">
            <h1 className="membership-print-title">Olympic Gym</h1>
            <p className="membership-print-subtitle">Customer Membership Summary</p>
          </div>
        </header>

        <section className="membership-print-profile">
          <img
            src={customer.image || '/api/placeholder/120/120'}
            alt=""
            className="membership-print-photo"
          />
          <div className="membership-print-profile-text">
            <h2 className="membership-print-name">{customer.name}</h2>
            <p>Member ID: {customer.id}</p>
            <p>Phone: {customer.phone || '—'}</p>
            <p className="capitalize">Gender: {customer.gender || '—'}</p>
            {customer.shift && <p>Shift: {customer.shift}</p>}
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
              <th>Membership duration</th>
              <td>{membershipDuration(customer.registerDate)}</td>
            </tr>
            <tr>
              <th>Account status</th>
              <td>{customer.isActive ? 'Active' : 'Inactive'}</td>
            </tr>
            <tr>
              <th>Membership status</th>
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
          </tbody>
        </table>

        {hasBodyMetrics && (
          <section className="membership-print-metrics">
            <h3>Body metrics</h3>
            <table className="membership-print-table">
              <tbody>
                {customer.height != null && (
                  <tr>
                    <th>Height</th>
                    <td>{Number(customer.height).toFixed(1)} cm</td>
                  </tr>
                )}
                {customer.weight != null && (
                  <tr>
                    <th>Weight</th>
                    <td>{Number(customer.weight).toFixed(1)} kg</td>
                  </tr>
                )}
                {customer.bmi != null && (
                  <tr>
                    <th>BMI</th>
                    <td>{Number(customer.bmi).toFixed(2)}</td>
                  </tr>
                )}
                {customer.standardWeight != null && (
                  <tr>
                    <th>Standard weight</th>
                    <td>{Number(customer.standardWeight).toFixed(1)} kg</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        <footer className="membership-print-footer">
          <p>Printed: {new Date().toLocaleString()}</p>
        </footer>
      </div>
    </div>
  );
}

export function triggerMembershipPrint() {
  const sheet = document.querySelector('.membership-print-sheet');
  if (!sheet || !(sheet instanceof HTMLElement)) return;

  const parent = sheet.parentNode;
  const nextSibling = sheet.nextSibling;
  document.body.appendChild(sheet);
  document.body.classList.add('printing-membership');

  const cleanup = () => {
    document.body.classList.remove('printing-membership');
    if (parent) {
      if (nextSibling) {
        parent.insertBefore(sheet, nextSibling);
      } else {
        parent.appendChild(sheet);
      }
    }
  };

  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
}
