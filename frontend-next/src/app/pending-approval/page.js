'use client';
import { useState, useEffect } from 'react';

export default function PendingApproval() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem('stellarPublicKey');
    if (storedKey) {
      setAddress(storedKey);
      setIsConnected(true);
    } else {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-100 rounded-full mb-6">
              <span className="text-5xl">⏳</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Application Pending
            </h1>
            <p className="text-xl text-gray-600">
              We're reviewing your application
            </p>
          </div>

          {/* Timeline */}
          <div className="space-y-6">
            <div className="border-l-4 border-indigo-500 pl-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  ✅ Step 1: Application Submitted
                </h4>
                <p className="text-gray-600 text-sm">
                  Your application has been received successfully
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-yellow-600 mb-2">
                  ⏳ Step 2: Under Review
                </h4>
                <p className="text-gray-600 text-sm">
                  Our admin team is currently reviewing your application
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-400 mb-2">
                  ⭐ Step 3: Approval
                </h4>
                <p className="text-gray-400 text-sm">
                  You'll be automatically redirected once approved
                </p>
              </div>
            </div>

            {/* What happens next */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Our admin team will review your application within 24-48 hours</li>
                    <li>• You'll receive an email notification about the decision</li>
                    <li>• This page will automatically update when approved</li>
                    <li>• You can close this page and come back anytime</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Auto-refresh indicator */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Checking for updates...
              </div>
            </div>

            {/* Back to home */}
            <div className="text-center pt-6 border-t">
              <a href="/" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                ← Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
