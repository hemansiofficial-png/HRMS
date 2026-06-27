'use client';

import { useState } from 'react';
import { X, AlertCircle, Calendar, UserCheck } from 'lucide-react';

interface TerminationFormProps {
  employee: {
    id: string;
    name: string;
    designation: string;
    department: string;
    employeeCode: string;
  };
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

const terminationReasons = [
  'Absconding',
  'Misconduct',
  'Performance Issue',
  'Medical Condition',
  'Death',
  'Restructuring',
  'Policy Violation',
  'Attendance Issues',
  'Other'
];

export function TerminationForm({ employee, onClose, onSubmit }: TerminationFormProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    exitType: 'TERMINATION' as 'RESIGNATION' | 'TERMINATION',
    discussionWithEmployee: 'yes',
    discussionSummary: '',
    reasonCategory: '',
    reason: '',
    noticeDate: new Date().toISOString().split('T')[0],
    lastWorkingDay: '',
    okToRehire: true,
    additionalComments: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reasonCategory || !formData.lastWorkingDay) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        employeeId: employee.id,
        discussionWithEmployee: formData.discussionWithEmployee === 'yes'
      });
    } catch (error) {
      console.error('Error submitting termination:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNoticePeriod = () => {
    const notice = new Date(formData.noticeDate);
    const lwd = new Date(formData.lastWorkingDay);
    const days = Math.ceil((lwd.getTime() - notice.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Initiate exit - {employee.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{employee.designation} • {employee.employeeCode}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Employee Info Card */}
        <div className="m-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold text-lg">
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">{employee.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{employee.designation}</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Department: {employee.department}</span>
                <span>Worker Type: Permanent</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
          {/* Exit Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              What is the reason for initiating this exit? *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                formData.exitType === 'RESIGNATION' 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}>
                <input
                  type="radio"
                  name="exitType"
                  value="RESIGNATION"
                  checked={formData.exitType === 'RESIGNATION'}
                  onChange={(e) => setFormData({ ...formData, exitType: e.target.value as any })}
                  className="h-4 w-4 text-purple-600"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Employee wants to resign</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Voluntary resignation</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                formData.exitType === 'TERMINATION' 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}>
                <input
                  type="radio"
                  name="exitType"
                  value="TERMINATION"
                  checked={formData.exitType === 'TERMINATION'}
                  onChange={(e) => setFormData({ ...formData, exitType: e.target.value as any })}
                  className="h-4 w-4 text-purple-600"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Company decides to terminate</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Involuntary termination</p>
                </div>
              </label>
            </div>
          </div>

          {/* Discussion with Employee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Did you have discussion with employee regarding this? *
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="discussionWithEmployee"
                  value="yes"
                  checked={formData.discussionWithEmployee === 'yes'}
                  onChange={(e) => setFormData({ ...formData, discussionWithEmployee: e.target.value })}
                  className="h-4 w-4 text-purple-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="discussionWithEmployee"
                  value="no"
                  checked={formData.discussionWithEmployee === 'no'}
                  onChange={(e) => setFormData({ ...formData, discussionWithEmployee: e.target.value })}
                  className="h-4 w-4 text-purple-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
              </label>
            </div>
          </div>

          {/* Discussion Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Discussion Summary
            </label>
            <textarea
              value={formData.discussionSummary}
              onChange={(e) => setFormData({ ...formData, discussionSummary: e.target.value })}
              placeholder="Type here"
              rows={4}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800"
            />
          </div>

          {/* Termination Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for {formData.exitType === 'RESIGNATION' ? 'Resignation' : 'Termination'} *
            </label>
            <select
              value={formData.reasonCategory}
              onChange={(e) => setFormData({ ...formData, reasonCategory: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800"
            >
              <option value="">Select Reason</option>
              {terminationReasons.map((reason) => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          {/* Additional Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Comments
            </label>
            <textarea
              value={formData.additionalComments}
              onChange={(e) => setFormData({ ...formData, additionalComments: e.target.value })}
              placeholder="Any additional information"
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Termination/Notice Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.noticeDate}
                  onChange={(e) => setFormData({ ...formData, noticeDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Working Day *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.lastWorkingDay}
                  onChange={(e) => setFormData({ ...formData, lastWorkingDay: e.target.value })}
                  min={formData.noticeDate || new Date().toISOString().split('T')[0]}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
              {formData.lastWorkingDay && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Notice Period: {calculateNoticePeriod()} days
                </p>
              )}
            </div>
          </div>

          {/* Ok to Rehire */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.okToRehire}
                onChange={(e) => setFormData({ ...formData, okToRehire: e.target.checked })}
                className="h-4 w-4 text-purple-600 mt-0.5"
              />
              <div>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mark employee as Ok to rehire
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Check this if the employee is eligible for rehire in the future
                </p>
              </div>
            </label>
          </div>

          {/* Info Banner */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Submitting this will initiate an approval chain for approving this {formData.exitType.toLowerCase()}. 
                All relevant stakeholders will be notified.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Initiate exit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
