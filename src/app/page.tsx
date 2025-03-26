'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from "next/image";
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { CpuChipIcon, BookOpenIcon, ServerIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import HomeSignInButton from '../components/HomeSignInButton';
import Logo from '../components/Logo';

export default function Home() {
  const router = useRouter();

  // Optional: Uncomment this to automatically redirect to dashboard
  // useEffect(() => {
  //   router.push('/dashboard');
  // }, [router]);

  return (
    <div className="flex-1">
      {/* Hero section */}
      <div className="bg-[#FFF8DC] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center">
              <Logo width={120} height={40} />
              <span className="text-[#8B4513] font-extrabold text-4xl tracking-tight sm:text-5xl md:text-6xl ml-3">Languages</span>
            </div>
            <p className="mt-3 max-w-md mx-auto text-base text-[#A0522D] sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              LET'S TALK BUSINESS: WE LOVE TO TEACH
            </p>
            <div className="mt-8 flex justify-center space-x-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#8B4513] hover:bg-[#A0522D] transition"
              >
                Go to Dashboard
              </Link>
              <HomeSignInButton />
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 bg-[#FFF8DC] rounded-lg border border-[#DEB887]">
              <h3 className="text-xl font-semibold text-[#8B4513] mb-3">Test Generator</h3>
              <p className="text-gray-700 mb-4">
                Create custom English tests based on business content, articles, or videos.
              </p>
              <Link 
                href="/test-generator" 
                className="text-[#8B4513] font-medium hover:text-[#A0522D]"
              >
                Try it now →
              </Link>
            </div>
            <div className="p-6 bg-[#FFF8DC] rounded-lg border border-[#DEB887]">
              <h3 className="text-xl font-semibold text-[#8B4513] mb-3">Class Diary</h3>
              <p className="text-gray-700 mb-4">
                Track student progress, manage class notes, and monitor performance over time.
              </p>
              <Link 
                href="/class-diary" 
                className="text-[#8B4513] font-medium hover:text-[#A0522D]"
              >
                Try it now →
              </Link>
            </div>
            <div className="p-6 bg-[#FFF8DC] rounded-lg border border-[#DEB887]">
              <h3 className="text-xl font-semibold text-[#8B4513] mb-3">User Database</h3>
              <p className="text-gray-700 mb-4">
                Manage teachers, students, and user profiles in your system with role-based access control.
              </p>
              <Link 
                href="/database" 
                className="text-[#8B4513] font-medium hover:text-[#A0522D]"
              >
                Try it now →
              </Link>
            </div>
            <div className="p-6 bg-[#FFF8DC] rounded-lg border border-[#DEB887]">
              <h3 className="text-xl font-semibold text-[#8B4513] mb-3">Report</h3>
              <p className="text-gray-700 mb-4">
                Analyze student performance metrics and view rankings based on test results.
              </p>
              <Link 
                href="/report" 
                className="text-[#8B4513] font-medium hover:text-[#A0522D]"
              >
                Try it now →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to enhance your teaching?</h2>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Start using our professional tools to create engaging business English lessons.
          </p>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#8B4513] hover:bg-[#A0522D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513]"
          >
            Go to Dashboard
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center justify-center md:justify-start">
                <Logo width={100} height={33} variant="light" />
                <h3 className="text-white font-bold text-xl ml-2">Languages</h3>
              </div>
              <p className="text-gray-300 mt-2">Professional English teaching tools</p>
            </div>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
              <Link href="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
              <Link href="/test-generator" className="text-gray-300 hover:text-white">Test Generator</Link>
              <Link href="/class-diary" className="text-gray-300 hover:text-white">Class Diary</Link>
              <Link href="/database" className="text-gray-300 hover:text-white">User Database</Link>
              <Link href="/report" className="text-gray-300 hover:text-white">Report</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} B2B Languages. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
