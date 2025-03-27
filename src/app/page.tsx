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
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Main hero logo - no spacing */}
            <div className="flex justify-center items-center -mt-8">
              <Logo width={300} height={300} variant="dark" className="animate-fade-in" />
            </div>
            {/* B2B Languages heading - reduced spacing by 75% */}
            <div className="-mt-16">
              <h1 className="text-4xl tracking-tight font-medium text-[var(--foreground)] sm:text-5xl md:text-6xl animate-fade-in">
                B2B Languages
              </h1>
              <p className="mt-2 max-w-md mx-auto text-base text-[var(--subtle)] sm:text-lg md:text-xl md:max-w-3xl animate-fade-in">
                LET'S TALK BUSINESS: WE LOVE TO TEACH
              </p>
            </div>
            {/* Button - keeping current spacing */}
            <div className="mt-8 flex justify-center space-x-6">
              <Link
                href="/dashboard"
                className="b2b-button"
              >
                Go to Dashboard
              </Link>
              <HomeSignInButton />
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="pt-8 pb-16 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-medium text-center text-[var(--foreground)] mb-8">Our Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="b2b-card group">
              <div className="flex flex-col h-full">
                <CpuChipIcon className="w-8 h-8 text-[var(--primary)] mb-6" />
                <h3 className="text-xl font-medium text-[var(--foreground)] mb-4">Test Generator</h3>
                <p className="text-[var(--subtle)] mb-6 flex-grow">
                  Create custom English tests based on business content, articles, or videos.
                </p>
                <Link 
                  href="/test-generator" 
                  className="inline-flex items-center text-[var(--primary)] font-medium group-hover:text-[var(--primary-dark)] transition-colors"
                >
                  Try it now <ArrowRightIcon className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
            
            <div className="b2b-card group">
              <div className="flex flex-col h-full">
                <BookOpenIcon className="w-8 h-8 text-[var(--primary)] mb-6" />
                <h3 className="text-xl font-medium text-[var(--foreground)] mb-4">Class Diary</h3>
                <p className="text-[var(--subtle)] mb-6 flex-grow">
                  Track student progress, manage class notes, and monitor performance over time.
                </p>
                <Link 
                  href="/class-diary" 
                  className="inline-flex items-center text-[var(--primary)] font-medium group-hover:text-[var(--primary-dark)] transition-colors"
                >
                  Try it now <ArrowRightIcon className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
            
            <div className="b2b-card group">
              <div className="flex flex-col h-full">
                <ServerIcon className="w-8 h-8 text-[var(--primary)] mb-6" />
                <h3 className="text-xl font-medium text-[var(--foreground)] mb-4">User Database</h3>
                <p className="text-[var(--subtle)] mb-6 flex-grow">
                  Manage teachers, students, and user profiles in your system with role-based access control.
                </p>
                <Link 
                  href="/database" 
                  className="inline-flex items-center text-[var(--primary)] font-medium group-hover:text-[var(--primary-dark)] transition-colors"
                >
                  Try it now <ArrowRightIcon className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
            
            <div className="b2b-card group">
              <div className="flex flex-col h-full">
                <BuildingOfficeIcon className="w-8 h-8 text-[var(--primary)] mb-6" />
                <h3 className="text-xl font-medium text-[var(--foreground)] mb-4">Report</h3>
                <p className="text-[var(--subtle)] mb-6 flex-grow">
                  Analyze student performance metrics and view rankings based on test results.
                </p>
                <Link 
                  href="/report" 
                  className="inline-flex items-center text-[var(--primary)] font-medium group-hover:text-[var(--primary-dark)] transition-colors"
                >
                  Try it now <ArrowRightIcon className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-medium text-[var(--foreground)] mb-6">Ready to enhance your teaching?</h2>
          <p className="text-xl text-[var(--subtle)] mb-10 max-w-3xl mx-auto">
            Start using our professional tools to create engaging business English lessons.
          </p>
          <Link 
            href="/dashboard" 
            className="b2b-button"
          >
            Go to Dashboard
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--foreground)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center justify-center md:justify-start">
                <Logo width={120} height={40} variant="light" />
              </div>
              <p className="text-[var(--subtle)] mt-4">Professional English teaching tools</p>
            </div>
            <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-8">
              <Link href="/dashboard" className="text-[var(--subtle)] hover:text-white transition-colors">Dashboard</Link>
              <Link href="/test-generator" className="text-[var(--subtle)] hover:text-white transition-colors">Test Generator</Link>
              <Link href="/class-diary" className="text-[var(--subtle)] hover:text-white transition-colors">Class Diary</Link>
              <Link href="/database" className="text-[var(--subtle)] hover:text-white transition-colors">User Database</Link>
              <Link href="/report" className="text-[var(--subtle)] hover:text-white transition-colors">Report</Link>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-gray-800 text-center text-[var(--subtle)] text-sm">
            © {new Date().getFullYear()} B2B Languages. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
