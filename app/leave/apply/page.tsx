'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Calendar, FileText, AlertCircle, Clock, X, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const leaveSchema = z.object({
  leaveType: z.string().min(1, 'Leave type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

type LeaveFormData = z.infer<typeof leaveSchema>;

const leaveConfig = {
  PAID_LEAVE: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-600', label: 'Paid Leave' },
  UNPAID_LEAVE: { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-600', label: 'Unpaid Leave' },
  WFH: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600', label: 'WFH' },
  SICK_LEAVE: { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-600', label: 'Sick Leave' },
  CASUAL_LEAVE: { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-600', label: 'Casual Leave' },
};

export default function ApplyLeavePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<any[]>([]);
  const [selectedDays, setSelectedDays] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showModal, setShowModal] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const leaveType = watch('leaveType');

  useEffect(() => {
    fetchBalances();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setSelectedDays(Math.max(0, days));
    }
  }, [startDate, endDate]);

  const fetchBalances = async () => {
    try {
      const response = await fetch('/api/leave/balance');
      if (response.ok) {
        const data = await response.json();
        setBalances(data);
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    }
  };

  const onSubmit = async (data: LeaveFormData) => {
    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      // Validate dates
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);

      if (start > end) {
        setErrorMsg('End date must be after start date');
        setLoading(false);
        return;
      }

      if (start < new Date()) {
        setErrorMsg('Cannot apply for leave in the past');
        setLoading(false);
        return;
      }

      // Check balance
      const balance = balances.find((b) => b.leaveType === data.leaveType);
      if (balance && selectedDays > balance.remaining) {
        setErrorMsg(`Insufficient balance. You have ${balance.remaining} days available`);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          days: selectedDays,
        }),
      });

      if (response.ok) {
        setSuccessMsg('Leave request submitted successfully!');
        setShowModal(false);
        reset();
        setSelectedDays(0);
        setTimeout(() => router.push('/leave'), 2000);
      } else {
        const error = await response.json();
        setErrorMsg(error.message || 'Failed to submit leave request');
        setLoading(false);
      }
    } catch (error) {
      setErrorMsg('An error occurred. Please try again.');
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const getRemainingDays = () => {
    if (!leaveType) return null;
    const balance = balances.find((b) => b.leaveType === leaveType);
    return balance ? balance.remaining : 0;
  };

  const handleOpenModal = () => {
    setShowModal(true);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
    setSelectedDays(0);
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <AppShell title="Leave Management">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leave Applications</h1>
            <p className="text-gray-600 mt-1">Manage and track your leave requests</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition flex items-center gap-2 font-semibold shadow-lg"
          >
            <Calendar className="w-5 h-5" /> Apply for Leave
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex gap-3">
              <Clock className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">Important Guidelines</h3>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                  <li>Apply at least 5 days in advance for casual leave</li>
                  <li>Medical certificates required for sick leave above 2 days</li>
                  <li>Leaves cannot be applied for without sufficient balance</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900">Quick Stats</h3>
                <div className="mt-3 space-y-2">
                  {balances.slice(0, 3).map((balance) => (
                    <div key={balance.leaveType} className="flex justify-between text-sm">
                      <span className="text-green-800">{balance.leaveType}:</span>
                      <span className="font-bold text-green-900">{balance.remaining} days</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Empty State / Instructions */}
        <Card className="p-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to Apply for Leave?</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Click the "Apply for Leave" button above to submit your leave request through our quick modal form.
            </p>
            <button
              onClick={handleOpenModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition font-semibold shadow-lg inline-flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" /> Start Application
            </button>
          </div>
        </Card>
      </div>

      {/* Leave Application Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-in zoom-in-95 my-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Apply for Leave</h3>
                <p className="text-sm text-gray-500 mt-1">Submit your leave request</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition"
                disabled={loading}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Error Message */}
              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800 text-sm">{errorMsg}</p>
                </div>
              )}

              {/* Success Message */}
              {successMsg && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-green-800 text-sm">{successMsg}</p>
                </div>
              )}

              {/* Leave Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Leave Type *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(leaveConfig).map(([key, config]) => {
                    const balance = balances.find((b) => b.leaveType === key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setValue('leaveType', key)}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                          leaveType === key
                            ? `${config.light} ${config.text} border-current`
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg ${leaveType === key ? config.bg : 'bg-gray-100'} flex items-center justify-center`} />
                        <span className="text-sm font-semibold">{config.label}</span>
                        {balance && (
                          <span className="text-xs text-gray-600 font-medium">{balance.remaining} days</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {errors.leaveType && (
                  <p className="text-red-600 text-sm mt-2">{errors.leaveType.message}</p>
                )}
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}
                  />
                  {errors.startDate && (
                    <p className="text-red-600 text-sm mt-1">{errors.startDate.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
                  <input
                    type="date"
                    {...register('endDate')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={startDate || new Date().toISOString().split('T')[0]}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}
                  />
                  {errors.endDate && (
                    <p className="text-red-600 text-sm mt-1">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              {/* Days Summary */}
              {selectedDays > 0 && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Total Days:</span>
                    <span className="text-2xl font-bold text-blue-600">{selectedDays} days</span>
                  </div>
                  {leaveType && (
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-gray-600">Balance after approval:</span>
                      <span className="font-semibold text-gray-900">
                        {Math.max(0, (getRemainingDays() || 0) - selectedDays)} days
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Leave *</label>
                <textarea
                  {...register('reason')}
                  rows={3}
                  placeholder="Please provide a detailed reason for your leave application..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                {errors.reason && (
                  <p className="text-red-600 text-sm mt-1">{errors.reason.message}</p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
