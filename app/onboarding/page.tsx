'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Loader2, AlertCircle, ArrowRight, CheckCircle, Users, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingCheck() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasOrg, setHasOrg] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    // Check if user has an organization
    fetch('/api/organizations')
      .then((res) => res.json())
      .then((data) => {
        if (data.organization) {
          setHasOrg(true);
          router.push('/dashboard');
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        setChecking(false);
      });
  }, [status, router]);

  if (checking || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-body via-bg-body to-keka-primary-light flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-white shadow-elevated flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-keka-primary" />
          </div>
          <p className="text-lg font-semibold text-text-primary">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  if (hasOrg) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-body via-bg-body to-keka-primary-light flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-elevated overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-keka-primary to-keka-primary-dark p-8 text-center">
          <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Complete Your Setup
          </h1>
          <p className="text-white/90 text-sm">
            Create your organization to get started
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Info boxes */}
          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-keka-primary-light/50 border border-keka-primary/20">
              <AlertCircle className="h-5 w-5 text-keka-primary flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-semibold text-text-primary">Organization Required</p>
                <p className="text-xs text-text-secondary mt-1">
                  You need to create an organization before accessing the dashboard and HR features.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-semibold text-green-800">What you'll get</p>
                <p className="text-xs text-green-700 mt-1">
                  Employee management, attendance tracking, payroll, leave management, and more.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Link
              href="/auth/signup"
              className="group flex items-center justify-center gap-2 w-full bg-gradient-to-r from-keka-primary to-keka-primary-dark text-white py-4 rounded-xl font-semibold shadow-lg shadow-keka-primary/30 hover:shadow-xl hover:shadow-keka-primary/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              <Building2 className="h-5 w-5" />
              Create Organization
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 w-full bg-white border-2 border-gray-200 text-text-primary py-4 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              Go to Dashboard
            </Link>
          </div>

          {/* Features preview */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide text-center mb-4">
              What's included
            </p>
            <div className="grid grid-cols-3 gap-3">
              <FeatureItem icon={<Building2 className="h-4 w-4" />} label="Organization" />
              <FeatureItem icon={<Users className="h-4 w-4" />} label="Employees" />
              <FeatureItem icon={<Calendar className="h-4 w-4" />} label="Attendance" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50">
      <div className="text-keka-primary">{icon}</div>
      <span className="text-xs font-medium text-text-secondary">{label}</span>
    </div>
  );
}
