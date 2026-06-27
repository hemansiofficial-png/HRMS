'use client';

import { useState } from 'react';
import { X, Key, Copy, RefreshCw } from 'lucide-react';

interface PasswordResetModalProps {
  employee: {
    id: string;
    name: string;
    email: string;
    employeeCode: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_PASSWORD = 'Pass@123';

export function PasswordResetModal({ employee, onClose, onSuccess }: PasswordResetModalProps) {
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResetPassword = async () => {
    setResetting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/employees/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: employee.id })
      });
      const json = await res.json();
      if (res.ok) {
        setNewPassword(json.data.password);
        setMessage({ type: 'success', text: 'Password reset successfully!' });
      } else {
        setMessage({ type: 'error', text: json.message || 'Failed to reset password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while resetting password' });
    } finally {
      setResetting(false);
    }
  };

  const handleCopyPassword = () => {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword);
    }
  };

  const handleClose = () => {
    if (newPassword) {
      onSuccess();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <Key className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Reset Password</h3>
              <p className="text-sm text-gray-500">{employee.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This will reset the password for <strong>{employee.email}</strong> to the default password.
            </p>
          </div>

          {message && (
            <div className={`rounded-lg px-4 py-3 text-sm ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {newPassword && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-900 mb-2">New Password:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border border-green-300 font-mono text-lg text-green-700">
                  {newPassword}
                </code>
                <button
                  onClick={handleCopyPassword}
                  className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                  title="Copy password"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-green-700 mt-2">
                ⚠️ Share this password securely with the employee.
              </p>
            </div>
          )}

          {!newPassword && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="p-1 rounded bg-gray-100">
                <RefreshCw className="h-4 w-4" />
              </div>
              <span>Password will be reset to default: <strong>Pass@123</strong></span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            {newPassword ? 'Close' : 'Cancel'}
          </button>
          {!newPassword && (
            <button
              onClick={handleResetPassword}
              disabled={resetting}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {resetting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  Reset Password
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
