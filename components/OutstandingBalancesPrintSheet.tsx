'use client';

import { Customer } from '@/types/customer';

interface OutstandingBalancesPrintSheetProps {
  customers: Customer[];
}

export default function OutstandingBalancesPrintSheet({
  customers,
}: OutstandingBalancesPrintSheetProps) {
  const rows = customers
    .filter((c) => Number(c.balance ?? 0) > 0)
    .sort((a, b) => Number(b.balance ?? 0) - Number(a.balance ?? 0));

  const total = rows.reduce((sum, c) => sum + Number(c.balance ?? 0), 0);

  return (
    <div className="outstanding-print-sheet" aria-hidden="true">
      <div className="outstanding-print-inner">
        <header className="outstanding-print-header">
          <div>
            <h1>Outstanding Balances</h1>
            <p>Olympic Gym</p>
          </div>
          <div className="outstanding-print-meta">
            <p>Printed: {new Date().toLocaleString()}</p>
            <p>Members: {rows.length}</p>
            <p>Total: ${total.toFixed(2)}</p>
          </div>
        </header>

        <table className="outstanding-print-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Member Name</th>
              <th>Phone</th>
              <th>Shift</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <img
                    src={customer.image || '/api/placeholder/80/80'}
                    alt={customer.name}
                    className="outstanding-print-avatar"
                  />
                </td>
                <td>{customer.name}</td>
                <td>{customer.phone || '—'}</td>
                <td>{customer.shift || '—'}</td>
                <td>${Number(customer.balance ?? 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function triggerOutstandingBalancesPrint() {
  const sheet = document.querySelector('.outstanding-print-sheet');
  if (!sheet || !(sheet instanceof HTMLElement)) return;

  const parent = sheet.parentNode;
  const nextSibling = sheet.nextSibling;
  document.body.appendChild(sheet);
  document.body.classList.add('printing-outstanding-balances');

  const cleanup = () => {
    document.body.classList.remove('printing-outstanding-balances');
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
