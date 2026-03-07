'use client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

interface Role {
  id: number;
  name: string;
  description: string | null;
}

interface EditUser {
  id: number;
  username: string;
  role: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: EditUser | null;
  onUpdated: () => void;
}

export default function EditUserModal({ isOpen, onClose, user, onUpdated }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    role: '',
    password: '',
    confirmPassword: '',
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/roles')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setRoles(data))
      .catch(() => setRoles([]));
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        username: user.username,
        role: user.role,
        password: '',
        confirmPassword: '',
      });
    }
  }, [isOpen, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        Swal.fire({
          icon: 'error',
          title: 'Password Mismatch',
          text: 'Password and confirm password do not match.',
          timer: 2000,
          showConfirmButton: false,
        });
        return;
      }
      if (formData.password.length < 6) {
        Swal.fire({
          icon: 'error',
          title: 'Weak Password',
          text: 'Password must be at least 6 characters long.',
          timer: 2000,
          showConfirmButton: false,
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const body: any = {
        username: formData.username,
        role: formData.role,
      };
      if (formData.password) {
        body.password = formData.password;
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update user');
      }

      await onUpdated();
      Swal.fire({
        icon: 'success',
        title: 'User Updated',
        text: `User ${formData.username} has been updated.`,
        timer: 2000,
        showConfirmButton: false,
      });
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error instanceof Error ? error.message : 'Failed to update user. Please try again.',
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-4 mx-2 sm:mx-4">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex justify-between items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Edit User</h2>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 disabled:opacity-50"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 disabled:opacity-50"
            >
              {roles.length === 0 && <option value={formData.role}>{formData.role}</option>}
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password (optional)
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 disabled:opacity-50"
              placeholder="Leave blank to keep current password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 disabled:opacity-50"
              placeholder="Repeat new password"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

