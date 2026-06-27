'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function DebugAdminLeavePage() {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<any>(null);
  const [leaveRequests, setLeaveRequests] = useState<any>(null);
  const [allLeaves, setAllLeaves] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      debugAdminLeave();
    }
  }, [session]);

  async function debugAdminLeave() {
    try {
      setLoading(true);
      
      // Step 1: Get user info
      const empResponse = await fetch('/api/auth/me');
      const empResult = await empResponse.json();
      console.log('Step 1 - User Info:', empResult);
      setUserData(empResult);
      
      // Step 2: Fetch leave approvals API
      const approvalsUrl = '/api/leave/approve?status=pending';
      const approvalsResponse = await fetch(approvalsUrl);
      const approvalsResult = await approvalsResponse.json();
      console.log('Step 2 - Approvals API (pending):', approvalsResult);
      setLeaveRequests(approvalsResult);

      // Step 3: Fetch ALL leave requests (for comparison)
      const allLeavesResponse = await fetch('/api/leave');
      const allLeavesResult = await allLeavesResponse.json();
      console.log('Step 3 - All Leaves:', allLeavesResult);
      setAllLeaves(allLeavesResult);
      
    } catch (error) {
      console.error('Debug error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug Admin Leave Approvals</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Debug Admin Leave Approvals</h1>
      
      {/* Session Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-bold mb-2">Session Info</h2>
        <pre className="text-sm bg-white p-3 rounded overflow-auto max-h-40">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      {/* User Info */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h2 className="text-lg font-bold mb-2">User Info (/api/auth/me)</h2>
        <pre className="text-sm bg-white p-3 rounded overflow-auto max-h-60">
          {JSON.stringify(userData, null, 2)}
        </pre>
        {userData?.user?.role ? (
          <p className="mt-2 text-green-700 font-semibold">
            ✓ User Role: {userData.user.role}
          </p>
        ) : (
          <p className="mt-2 text-red-700 font-semibold">
            ✗ User role not found
          </p>
        )}
        {userData?.employee?.id ? (
          <p className="mt-2 text-green-700 font-semibold">
            ✓ Employee ID: {userData.employee.id}
          </p>
        ) : (
          <p className="mt-2 text-yellow-700 font-semibold">
            ⚠ No employee record
          </p>
        )}
      </div>

      {/* Leave Approvals API */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-lg font-bold mb-2">Leave Approvals API (status=pending)</h2>
        <pre className="text-sm bg-white p-3 rounded overflow-auto max-h-60">
          {JSON.stringify(leaveRequests, null, 2)}
        </pre>
        {leaveRequests?.data?.length ? (
          <p className="mt-2 text-green-700 font-semibold">
            ✓ Found {leaveRequests.data.length} pending leave request(s)
          </p>
        ) : (
          <p className="mt-2 text-red-700 font-semibold">
            ✗ No pending leave requests found
            {leaveRequests?.error && ` - Error: ${leaveRequests.error}`}
          </p>
        )}
      </div>

      {/* All Leave Requests */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h2 className="text-lg font-bold mb-2">All Leave Requests (from /api/leave)</h2>
        <pre className="text-sm bg-white p-3 rounded overflow-auto max-h-60">
          {JSON.stringify(allLeaves, null, 2)}
        </pre>
        {allLeaves?.data?.length ? (
          <p className="mt-2 text-green-700 font-semibold">
            ✓ Found {allLeaves.data.length} total leave request(s) in database
          </p>
        ) : (
          <p className="mt-2 text-red-700 font-semibold">
            ✗ No leave requests in database - Create some leave requests first!
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
        <h2 className="text-lg font-bold mb-2">Summary & Actions</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Your role: <strong>{userData?.user?.role || 'Unknown'}</strong></li>
          <li>Employee ID: <strong>{userData?.employee?.id || 'None'}</strong></li>
          <li>Pending approvals: <strong>{leaveRequests?.data?.length || 0}</strong></li>
          <li>Total leaves in DB: <strong>{allLeaves?.data?.length || 0}</strong></li>
        </ul>
        
        {(!allLeaves?.data || allLeaves.data.length === 0) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="font-semibold text-red-800">
              ⚠ No leave requests exist in the database!
            </p>
            <p className="text-sm text-red-700 mt-1">
              Go to the Leave page and create a leave request first.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
        <button
          onClick={() => window.location.href = '/leave/approvals'}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Go to Leave Approvals
        </button>
        <button
          onClick={() => window.location.href = '/leave'}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Go to Leave Page
        </button>
      </div>
    </div>
  );
}
