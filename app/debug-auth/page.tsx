'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function DebugAuthPage() {
  const { data: session, status } = useSession();
  const [dbTest, setDbTest] = useState<any>(null);
  const [loginTest, setLoginTest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('admin@hrms.local');
  const [password, setPassword] = useState('Pass@123');

  useEffect(() => {
    console.log('[Debug Page] Session Status:', status);
    console.log('[Debug Page] Session Data:', session);
  }, [session, status]);

  const testDatabase = async () => {
    try {
      const res = await fetch('/api/test-db');
      const data = await res.json();
      setDbTest(data);
    } catch (error: any) {
      setDbTest({ error: error.message });
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      console.log('[Debug Page] Attempting login with:', { email, password });
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });
      console.log('[Debug Page] Login result:', result);
      setLoginTest({
        success: result?.ok,
        error: result?.error,
        result
      });
    } catch (error: any) {
      console.error('[Debug Page] Login error:', error);
      setLoginTest({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testSignOut = async () => {
    await signOut({ redirect: false });
    setLoginTest(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Authentication Debug Page</h1>

        {/* Session Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          <div className="space-y-2">
            <p>
              <strong>Status:</strong>{' '}
              <code className={`px-2 py-1 rounded ${
                status === 'authenticated' ? 'bg-green-100 text-green-800' :
                status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {status}
              </code>
            </p>
            <p>
              <strong>User:</strong>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">
                {session?.user?.email || 'Not signed in'}
              </code>
            </p>
            <p>
              <strong>Role:</strong>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">
                {(session?.user as any)?.role || 'N/A'}
              </code>
            </p>
            {session && (
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Database Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Database Test</h2>
          <button
            onClick={testDatabase}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4"
          >
            Test Database Connection
          </button>
          {dbTest && (
            <pre className={`p-4 rounded text-xs overflow-auto ${
              dbTest.databaseConnected ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {JSON.stringify(dbTest, null, 2)}
            </pre>
          )}
        </div>

        {/* Login Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Login Test</h2>
          {!session ? (
            <>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded"
                  />
                </div>
              </div>
              <button
                onClick={testLogin}
                disabled={loading}
                className="bg-keka-purple text-white px-4 py-2 rounded hover:bg-keka-purple-dark disabled:bg-gray-400"
              >
                {loading ? 'Logging in...' : 'Test Login'}
              </button>
            </>
          ) : (
            <button
              onClick={testSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          )}
          {loginTest && (
            <pre className={`mt-4 p-4 rounded text-xs overflow-auto ${
              loginTest.success ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {JSON.stringify(loginTest, null, 2)}
            </pre>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Open browser console (F12) to see debug logs</li>
            <li>Click "Test Database Connection" to verify DB is working</li>
            <li>Try logging in with the credentials above</li>
            <li>Check console for [NextAuth] logs</li>
            <li>If login succeeds, you should see session data above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
