import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface Role {
  id: number;
  name: string;
  description: string | null;
}

interface User {
  id: string;
  username: string;
  password: string;
  role: string;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (user: Omit<User, 'id'>) => void;
}

export default function AddUserModal({ isOpen, onClose, onAdd }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'staff'
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/roles')
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        setRoles(data);
        if (data.length > 0) {
          setFormData((prev) => {
            const hasCurrent = data.some((r: Role) => r.name === prev.role);
            return hasCurrent ? prev : { ...prev, role: data[0].name };
          });
        }
      })
      .catch(() => setRoles([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Password Mismatch',
        text: 'Password and confirm password do not match.',
        timer: 2000,
        showConfirmButton: false,
      });
      setIsLoading(false);
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
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          role: formData.role,
          password: formData.password
          // Remove name from here
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const newUser = await response.json();

      // Call the onAdd callback with the created user
      onAdd({
        username: formData.username,
        password: formData.password,
        role: formData.role
      });

      // Reset form
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        role: 'staff'
      });

      Swal.fire({
        icon: 'success',
        title: 'User Created!',
        text: `User ${formData.username} has been successfully created.`,
        timer: 2000,
        showConfirmButton: false,
      });

    } catch (error) {
      console.error('Error creating user:', error);
      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: error instanceof Error ? error.message : 'Failed to create user. Please try again.',
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-4 mx-2 sm:mx-4">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex justify-between items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Add New User</h2>
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

          {/* Remove the name field */}

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
                {roles.length === 0 && <option value="staff">Staff</option>}
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>
                ))}
              </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 disabled:opacity-50"
              placeholder="Enter password (min. 6 characters)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 disabled:opacity-50"
              placeholder="Confirm password"
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
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Add User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}