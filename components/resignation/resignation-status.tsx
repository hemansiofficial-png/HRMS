'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  User,
  FileText,
  Briefcase,
  TrendingUp
} from 'lucide-react';

interface ResignationStatusProps {
  resignation: any;
  onWithdraw: () => void;
}

const statusConfig: any = {
  DRAFT: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800',
    icon: AlertCircle
  },
  PENDING: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock
  },
  SUBMITTED: {
    label: 'Submitted',
    color: 'bg-blue-100 text-blue-800',
    icon: FileText
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    color: 'bg-purple-100 text-purple-800',
    icon: Clock
  },
  APPROVED: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  }
};

export function ResignationStatus({ resignation, onWithdraw }: ResignationStatusProps) {
  const statusInfo = statusConfig[resignation.status] || statusConfig.PENDING;
  const StatusIcon = statusInfo.icon;

  const canWithdraw = ['SUBMITTED', 'PENDING', 'UNDER_REVIEW'].includes(resignation.status);
  const isApproved = resignation.status === 'APPROVED' || resignation.status === 'ACCEPTED';
  const isRejected = resignation.status === 'REJECTED';
  const isCompleted = resignation.status === 'COMPLETED';

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${statusInfo.color.replace('text-', 'bg-').replace('bg-', 'bg-opacity-20 ')}`}>
              <StatusIcon className={`h-8 w-8 ${statusInfo.color.split(' ')[1]}`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Resignation {statusInfo.label}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Status: <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
              </p>
            </div>
          </div>
          {canWithdraw && (
            <Button
              onClick={onWithdraw}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Withdraw Resignation
            </Button>
          )}
        </div>

        {/* Key Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
              <Calendar className="h-5 w-5" />
              <span className="text-sm font-medium">Resignation Date</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {new Date(resignation.resignationDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">Notice Period</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {resignation.noticePeriodDays} days
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
              <Briefcase className="h-5 w-5" />
              <span className="text-sm font-medium">Last Working Day</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {new Date(resignation.lastWorkingDay).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* Resignation Details */}
      <Card className="p-6">
        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Resignation Details</h4>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Reason for Resignation</p>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                {resignation.reasonCategory}
              </span>
            </div>
            {resignation.reason && (
              <p className="mt-2 text-gray-700 dark:text-gray-300">{resignation.reason}</p>
            )}
          </div>

          {resignation.discussionWithManager && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Discussion with Manager</p>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-gray-700 dark:text-gray-300">Yes, discussed</span>
              </div>
              {resignation.discussionSummary && (
                <p className="mt-2 text-gray-700 dark:text-gray-300">{resignation.discussionSummary}</p>
              )}
            </div>
          )}

          {resignation.noticePeriodWaiver && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Notice Period Waiver</p>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-gray-700 dark:text-gray-300">Requested</span>
              </div>
              {resignation.waiverReason && (
                <p className="mt-2 text-gray-700 dark:text-gray-300">{resignation.waiverReason}</p>
              )}
            </div>
          )}

          {isApproved && resignation.approvedBy && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Approved By</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold">
                  {resignation.approvedBy.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{resignation.approvedBy.name}</p>
                  <p className="text-sm text-gray-500">{resignation.approvedBy.email}</p>
                </div>
                <span className="ml-auto text-sm text-gray-500">
                  {new Date(resignation.approvedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          )}

          {isRejected && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-red-800 dark:text-red-300 mb-1">Rejection Reason</p>
                <p className="text-sm text-red-700 dark:text-red-400">{resignation.rejectionReason}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Clearance Tasks Progress */}
      {(isApproved || isCompleted) && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">Clearance Progress</h4>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {resignation.clearanceProgress?.completed || 0} / {resignation.clearanceProgress?.total || 0} Completed
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                style={{ 
                  width: `${((resignation.clearanceProgress?.completed || 0) / (resignation.clearanceProgress?.total || 1)) * 100}%` 
                }}
              />
            </div>
          </div>

          {/* Task List would go here - using separate component */}
          <ClearanceTasks resignationId={resignation.id} />
        </Card>
      )}
    </div>
  );
}

// Clearance Tasks Sub-component
function ClearanceTasks({ resignationId }: { resignationId: string }) {
  // This would fetch and display individual clearance tasks
  // For now, showing placeholder
  return (
    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
      <p>Clearance tasks will be displayed here</p>
      <p className="text-sm mt-1">Your manager will assign specific tasks for handover</p>
    </div>
  );
}
