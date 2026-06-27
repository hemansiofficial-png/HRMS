'use client';

import { useState } from 'react';
import { X, AlertTriangle, Calendar, FileText } from 'lucide-react';

interface ResignationFormProps {
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

const resignationReasons = [
  'Explore Other careers',
  'Personal Reasons',
  'Relocating',
  'Retirement',
  'Higher Studies',
  'Health Issues',
  'Work-Life Balance',
  'Career Growth',
  'Other'
];

export function ResignationForm({ onClose, onSubmit }: ResignationFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    discussionWithManager: 'no',
    discussionSummary: '',
    reasonCategory: '',
    reason: '',
    lastWorkingDay: '',
    noticePeriodWaiver: false,
    waiverReason: ''
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
        discussionWithManager: formData.discussionWithManager === 'yes'
      });
    } catch (error) {
      console.error('Error submitting resignation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Resign from job</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="m-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              This will trigger your job resignation process. It is always advisable to talk to your management first before coming here!
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
          {/* Discussion with Manager */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Did you have discussion with manager on your decision to exit? *
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="discussionWithManager"
                  value="yes"
                  checked={formData.discussionWithManager === 'yes'}
                  onChange={(e) => setFormData({ ...formData, discussionWithManager: e.target.value })}
                  className="h-4 w-4 text-purple-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="discussionWithManager"
                  value="no"
                  checked={formData.discussionWithManager === 'no'}
                  onChange={(e) => setFormData({ ...formData, discussionWithManager: e.target.value })}
                  className="h-4 w-4 text-purple-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
              </label>
            </div>
          </div>

          {/* Discussion Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Please write the summary of your discussion
            </label>
            <textarea
              value={formData.discussionSummary}
              onChange={(e) => setFormData({ ...formData, discussionSummary: e.target.value })}
              placeholder="Type here"
              rows={4}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800"
            />
          </div>

          {/* Reason Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Please select a reason for your resignation *
            </label>
            <select
              value={formData.reasonCategory}
              onChange={(e) => setFormData({ ...formData, reasonCategory: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800"
            >
              <option value="">Select reason</option>
              {resignationReasons.map((reason) => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          {/* Additional Reason Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Provide more details about your decision"
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800"
            />
          </div>

          {/* Last Working Day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Expected Last Working Day *
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.lastWorkingDay}
                onChange={(e) => setFormData({ ...formData, lastWorkingDay: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Note: You are required to serve a notice period of 2 months (60 days)
            </p>
          </div>

          {/* Notice Period Waiver */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.noticePeriodWaiver}
                onChange={(e) => setFormData({ ...formData, noticePeriodWaiver: e.target.checked })}
                className="h-4 w-4 text-purple-600 mt-0.5"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Request notice period waiver
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Check this if you need an early release from the notice period
                </p>
              </div>
            </label>
            {formData.noticePeriodWaiver && (
              <textarea
                value={formData.waiverReason}
                onChange={(e) => setFormData({ ...formData, waiverReason: e.target.value })}
                placeholder="Please provide reason for waiver request"
                rows={2}
                className="w-full mt-3 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800"
              />
            )}
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
              {loading ? 'Submitting...' : 'Submit resignation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
