"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function NotFound() {
  useEffect(() => {
    document.title = "404 - Page Not Found";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="floating">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            404
          </h1>
        </div>
        <h2 className="text-2xl font-semibold text-white mb-8">
          Oops! Page not found
        </h2>
        <p className="text-gray-300 max-w-md mb-8">
          The page you're looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Link
          href="/"
          className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
        >
          Return Home
        </Link>
      </div>

      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        .floating {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}