'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function DebugLeavePage() {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<any>(null);
  const [leaveData, setLeaveData] = useState<any>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      debugLeaveRequests();
    }
  }, [session]);

  async function debugLeaveRequests() {
    try {
      setLoading(true);
      // Step 1: Get employee ID
      const empResponse = await fetch('/api/auth/me');
      const empResult = await empResponse.json();
      console.log('Step 1 - Employee API:', empResult);
      setUserData(empResult);
      
      if (empResult?.employee?.id) {
        setEmployeeId(empResult.employee.id);
        
        // Step 2: Fetch leaves with employee ID
        const leaveUrl = `/api/leave?employeeId=${empResult.employee.id}`;
        const leaveResponse = await fetch(leaveUrl);
        const leaveResult = await leaveResponse.json();
        console.log('Step 2 - Leave API:', leaveResult);
        setLeaveData(leaveResult);
      }
      
      // Step 3: Fetch all leaves (for comparison)
      const allLeavesResponse = await fetch('/api/leave');
      const allLeavesResult = await allLeavesResponse.json();
      console.log('Step 3 - All Leaves:', allLeavesResult);
    } catch (error) {
      console.error('Debug error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug Leave Requests</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Debug Leave Requests</h1>
      
      {/* Session Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-bold mb-2">Session Info</h2>
        <pre className="text-sm bg-white p-3 rounded overflow-auto max-h-40">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      {/* Employee API Response */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h2 className="text-lg font-bold mb-2">Employee API Response (/api/auth/me)</h2>
        <pre className="text-sm bg-white p-3 rounded overflow-auto max-h-60">
          {JSON.stringify(userData, null, 2)}
        </pre>
        {userData?.employee?.id ? (
          <p className="mt-2 text-green-700 font-semibold">
            ✓ Employee ID found: {userData.employee.id}
          </p>
        ) : (
          <p className="mt-2 text-red-700 font-semibold">
            ✗ No employee record found for this user!
          </p>
        )}
      </div>

      {/* Leave API Response (with employee ID) */}
      {employeeId && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="text-lg font-bold mb-2">
            Leave API Response (employeeId={employeeId})
          </h2>
          <pre className="text-sm bg-white p-3 rounded overflow-auto max-h-60">
            {JSON.stringify(leaveData, null, 2)}
          </pre>
          {leaveData?.data?.length ? (
            <p className="mt-2 text-green-700 font-semibold">
              ✓ Found {leaveData.data.length} leave request(s)
            </p>
          ) : (
            <p className="mt-2 text-yellow-700 font-semibold">
              ✗ No leave requests found for this employee
            </p>
          )}
        </div>
      )}

      {/* All Leaves */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h2 className="text-lg font-bold mb-2">All Leave Requests (for comparison)</h2>
        <pre className="text-sm bg-white p-3 rounded overflow-auto max-h-60">
          {JSON.stringify(leaveData, null, 2)}
        </pre>
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
          onClick={() => window.location.href = '/leave'}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Go to Leave Page
        </button>
      </div>
    </div>
  );
}
