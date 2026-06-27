'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Building2, Users, Zap, Shield, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Subscription {
  id: string;
  planType: string;
  status: string;
  trialEndDate?: string;
  currentEmployees: number;
  maxEmployees: number;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export function SaaSMetrics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    subscription: Subscription | null;
    organization: Organization | null;
  } | null>(null);

  useEffect(() => {
    fetch('/api/subscriptions')
      .then((res) => res.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data?.subscription) {
    return null;
  }

  const { subscription, organization } = data;
  const isTrial = subscription.status === 'TRIAL';
  const daysLeft = subscription.trialEndDate
    ? Math.ceil((new Date(subscription.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-4">
      {/* Trial Banner */}
      {isTrial && daysLeft > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">
                  {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left in your {subscription.planType} trial
                </p>
                <p className="text-sm text-white/80">
                  Upgrade now to continue enjoying all features
                </p>
              </div>
            </div>
            <Link
              href="/settings/subscription"
              className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Upgrade
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* SaaS Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Plan Info */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-keka-purple/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-keka-purple" />
            </div>
            <span className="text-sm text-gray-500">Plan</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{subscription.planType}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
            subscription.status === 'TRIAL' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {subscription.status}
          </span>
        </div>

        {/* Organization */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-blue/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Organization</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate">
            {organization?.name || 'N/A'}
          </p>
          <Link href="/settings/organization" className="text-xs text-keka-purple hover:underline">
            Settings →
          </Link>
        </div>

        {/* Employee Usage */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-green/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Employees</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {subscription.currentEmployees} / {subscription.maxEmployees}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min((subscription.currentEmployees / subscription.maxEmployees) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-lg bg-purple/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Quick Actions</span>
          </div>
          <div className="space-y-1">
            <Link href="/settings/subscription" className="block text-xs text-keka-purple hover:underline">
              Upgrade Plan →
            </Link>
            <Link href="/pricing" className="block text-xs text-keka-purple hover:underline">
              View Pricing →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
