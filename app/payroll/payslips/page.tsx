'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function PayslipsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to payroll page with payslips filter
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let redirectUrl = '/payroll?view=payslips';
    if (month) redirectUrl += `&month=${month}`;
    if (year) redirectUrl += `&year=${year}`;

    router.push(redirectUrl);
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Loading Payslips</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting you to your payslips...</p>
      </div>
    </div>
  );
}

export default function PayslipsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PayslipsContent />
    </Suspense>
  );
}
