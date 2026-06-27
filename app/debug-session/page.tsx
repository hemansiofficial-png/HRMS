'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { getRoleBasePath, getAllowedPrefixes } from '@/lib/role-routes';

export default function DebugSessionPage() {
  const { data: session, status } = useSession();
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setApiData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching auth me:', err);
        setLoading(false);
      });
  }, []);

  const role = (session?.user as any)?.role || apiData?.user?.role;
  const roleBasePath = role ? getRoleBasePath(role) : 'N/A';
  const allowedPrefixes = role ? getAllowedPrefixes(role) : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Session Debug Info</h1>

        {/* Session Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Logged In:</strong> {status === 'authenticated' ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>

        {/* Session Data */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Data</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        {/* API /api/auth/me Response */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Response (/api/auth/me)</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(apiData, null, 2)}
            </pre>
          )}
        </div>

        {/* Role Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Role Information</h2>
          <div className="space-y-4">
            <p><strong>User Role:</strong> <span className="font-mono bg-blue-100 px-2 py-1 rounded">{role || 'Not found'}</span></p>
            <p><strong>Role Base Path:</strong> <span className="font-mono bg-green-100 px-2 py-1 rounded">{roleBasePath}</span></p>
            
            <div>
              <strong>Allowed Prefixes:</strong>
              <div className="flex flex-wrap gap-2 mt-2">
                {allowedPrefixes.map(prefix => (
                  <span key={prefix} className="font-mono bg-purple-100 px-2 py-1 rounded text-sm">
                    {prefix}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Test Links */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Links</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-2">Click these to test role-based redirects:</p>
            <div className="flex flex-wrap gap-2">
              <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                / (Root)
              </a>
              <a href="/dashboard" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                /dashboard
              </a>
              <a href="/admin" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                /admin
              </a>
              <a href="/manager" className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">
                /manager
              </a>
              <a href="/employee" className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700">
                /employee
              </a>
              <a href="/payroll" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                /payroll
              </a>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Reload Page
            </button>
            <button
              onClick={async () => {
                const res = await fetch('/api/auth/signout', { method: 'POST' });
                if (res.ok) window.location.reload();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
