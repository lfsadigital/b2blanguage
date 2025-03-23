import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { CpuChipIcon, BookOpenIcon, ServerIcon } from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#2a36b1] via-[#0071e3] to-[#47a0ff] opacity-90"></div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40 text-white">
          <div className="text-center md:text-left md:w-2/3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Elevate Your English <br/>
              <span className="text-[#FFDE59]">Business Teaching</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-white/90 max-w-2xl mx-auto md:mx-0">
              B2B Language provides innovative tools for English language teachers who work with business professionals.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link 
                href="/test-generator" 
                className="apple-button bg-white text-[var(--primary)] hover:bg-gray-100 px-8 py-3 text-base"
              >
                Start Creating Tests
              </Link>
              <Link 
                href="/" 
                className="apple-button-secondary bg-transparent border border-white/30 text-white hover:bg-white/10 px-8 py-3 text-base"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#FFDE59] rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#FF9F0A] rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] apple-heading">
              Professional Teaching Tools
            </h2>
            <p className="mt-4 text-[var(--subtle)] text-lg max-w-3xl mx-auto">
              Create engaging, personalized materials for your business English students
            </p>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Test and Class Generator Card */}
            <div className="flex flex-col px-8 md:px-20 py-20 w-full items-center justify-center space-y-12 bg-gradient-to-b from-white/60 to-[var(--background)]">
              <Link href="/test-generator" className="card flex flex-col items-center justify-center space-y-4 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all bg-white/90 max-w-md w-full">
                <CpuChipIcon className="w-16 h-16 text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Test and Class Generator</h2>
                <p className="text-sm text-[var(--primary)]">Generate tests, conversation questions, and teaching resources</p>
                <p className="text-xs text-gray-500 mt-2">Version 1.2.0 (Mar 23, 2024)</p>
              </Link>
            </div>
            
            {/* Class Diary and Evaluation Card */}
            <div className="flex flex-col px-8 md:px-20 py-20 w-full items-center justify-center space-y-12 bg-gradient-to-b from-white/60 to-[var(--background)]">
              <Link href="#" className="card flex flex-col items-center justify-center space-y-4 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all bg-white/90 max-w-md w-full">
                <BookOpenIcon className="w-16 h-16 text-[var(--secondary)]" />
                <h2 className="text-xl font-semibold">Class Diary and Evaluation</h2>
                <p className="text-sm text-[var(--secondary)]">Track student progress and manage class notes</p>
                <p className="text-xs text-gray-500 mt-2">Coming Soon</p>
              </Link>
            </div>
            
            {/* Database Card */}
            <div className="flex flex-col px-8 md:px-20 py-20 w-full items-center justify-center space-y-12 bg-gradient-to-b from-white/60 to-[var(--background)]">
              <Link href="#" className="card flex flex-col items-center justify-center space-y-4 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all bg-white/90 max-w-md w-full">
                <ServerIcon className="w-16 h-16 text-[#29cc41]" />
                <h2 className="text-xl font-semibold">Database</h2>
                <p className="text-sm text-[#29cc41]">Access teaching resources and lesson materials</p>
                <p className="text-xs text-gray-500 mt-2">Coming Soon</p>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonial Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-[var(--foreground)] apple-heading">
              Trusted by Business English Teachers Worldwide
            </h2>
            <blockquote className="mt-10">
              <p className="text-xl text-[var(--foreground)] italic">
                &quot;B2B Language tools have transformed my teaching. My corporate clients love the customized materials that perfectly match their industry vocabulary and business contexts.&quot;
              </p>
              <footer className="mt-4">
                <div className="font-medium text-[var(--foreground)]">Sarah Johnston</div>
                <div className="text-sm text-[var(--subtle)]">Senior Business English Instructor, London</div>
              </footer>
            </blockquote>
          </div>
        </div>
      </section>
    </main>
  );
}
