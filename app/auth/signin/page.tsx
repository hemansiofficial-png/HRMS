'use client';

import { signIn } from 'next-auth/react';
import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Shield, CheckCircle } from 'lucide-react';
import { getRoleBasePath } from '@/lib/role-routes';

function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const callbackUrl = searchParams.get('callbackUrl');

  // Fetch user role if already logged in
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.user?.role);
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error);
      }
    };
    fetchUserRole();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (userRole) {
      const rolePrefix = getRoleBasePath(userRole);
      router.push(rolePrefix);
    }
  }, [userRole, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    });

    if (!result?.ok) {
      setError('Invalid email or password');
      setLoading(false);
      return;
    }

    // Fetch user role after successful login
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        const role = data.user?.role;
        if (role) {
          // Redirect to role-specific URL
          window.location.href = getRoleBasePath(role);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    }

    // Fallback to callbackUrl or default
    window.location.href = callbackUrl || '/dashboard';
  }

  const features = [
    'Employee Self-Service Portal',
    'Attendance & Leave Management',
    'Payroll Processing & Claims',
    'Performance Management'
  ];

  return (
    <div className="flex flex-col lg:flex-row flex-1">
      {/* Left Side - Keka HR Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-keka-purple via-keka-purple-dark to-purple-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">HRMS Pro</h1>
            </div>
            {/* Hero Text */}
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Manage Your <br />
              <span className="text-white/80">Workforce Efficiently</span>
            </h2>
            <p className="text-lg text-white/80 max-w-md">
              A complete HR management solution for modern enterprises
            </p>
          </div>
          <div className="space-y-6">
            {/* Features */}
            <div>
              <h3 className="text-white font-semibold mb-4">Key Features</h3>
              <div className="space-y-3">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-white/90">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div>
                <p className="text-3xl font-bold text-white">2M+</p>
                <p className="text-sm text-white/70 mt-1">Employees</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">70+</p>
                <p className="text-sm text-white/70 mt-1">Countries</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">50+</p>
                <p className="text-sm text-white/70 mt-1">Industries</p>
              </div>
            </div>
          </div>
          <p className="text-white/60 text-sm">
            © 2025 HRMS Pro. Enterprise HR Management
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-keka-purple to-keka-purple-dark flex items-center justify-center shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">HRMS Pro</h1>
          </div>
          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-600">
              Sign in to access your HRMS dashboard
            </p>
          </div>
          {/* Login Card */}
          <div className="bg-white rounded-xl shadow-lg shadow-gray-200/50 p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-keka-purple/20 focus:border-keka-purple transition-all"
                  />
                </div>
              </div>
              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-keka-purple/20 focus:border-keka-purple transition-all"
                  />
                </div>
              </div>
              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-keka-purple focus:ring-keka-purple" />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm font-medium text-keka-purple hover:text-keka-purple-dark">
                  Forgot password?
                </a>
              </div>
              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-keka-purple to-keka-purple-dark hover:from-keka-purple-dark hover:to-purple-900 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 rounded-lg shadow-md shadow-keka-purple/25 hover:shadow-lg hover:shadow-keka-purple/30 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
            {/* Demo Credentials */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600 mb-4">
                Demo Credentials
              </p>
              <div className="space-y-2">
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">Admin Account</p>
                  <p className="text-sm text-gray-700">
                    Email: <code className="bg-white px-2 py-0.5 rounded text-keka-purple font-medium">admin@hrms.local</code>
                  </p>
                  <p className="text-sm text-gray-700">
                    Password: <code className="bg-white px-2 py-0.5 rounded text-keka-purple font-medium">Pass@123</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-8">
            Protected by enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-keka-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
