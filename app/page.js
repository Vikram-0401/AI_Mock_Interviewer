
"use client";
import React from 'react';
// import { useRouter } from 'next/navigation';

// export default function Home() {
//   const router = useRouter();

//   return (
//     <div className="bg-gray-900 h-screen flex flex-col justify-center items-center">
//       <h1 className="text-5xl font-bold text-white mb-8">Naukri Prep</h1>
//       <div className="space-x-4">
//         <button 
//           className="bg-blue-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
//           onClick={() => router.push('/auth/sign-in')}
//         >
//           Login
//         </button>
//         <button 
//           className="bg-green-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-green-600 transition duration-300"
//           onClick={() => router.push('/auth/sign-up')}
//         >
//           Signup
//         </button>
//       </div>
//     </div>
//   );
// }
// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold text-gray-800">
                AI Mock Interviewer
              </Link>
            </div>
            
            <div className="flex gap-4">
              <Link
                href="/sign-in"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                Sign In
              </Link>
              
              <Link
                href="/sign-up"
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to AI Mock Interviewer
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Practice your interview skills with our AI-powered platform
            </p>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                Get started by signing in or creating a new account
              </p>
              
              <div className="flex justify-center gap-4">
                <Link
                  href="/sign-in"
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
