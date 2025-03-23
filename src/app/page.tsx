import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon } from '@heroicons/react/24/outline';

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
            {/* Test Generator Card */}
            <Link 
              href="/test-generator"
              className="apple-card group"
            >
              <div className="h-40 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] p-6 flex items-end">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md shadow-lg flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
              
              <div className="px-6 py-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-[var(--foreground)]">Test Generator</h3>
                  <ArrowRightIcon className="h-5 w-5 text-[var(--primary)] group-hover:translate-x-1 transition-transform duration-200" />
                </div>
                <p className="mt-4 text-[var(--subtle)]">
                  Create customized English tests from videos or articles for your business professionals
                </p>
                <div className="mt-6 pt-6 border-t border-[var(--border)]">
                  <p className="text-sm text-[var(--primary)]">Generate tests, conversation questions, and teaching resources</p>
                </div>
              </div>
            </Link>
            
            {/* Vocabulary Builder Card (Coming Soon) */}
            <div className="apple-card bg-white">
              <div className="h-40 bg-gradient-to-r from-[var(--secondary)] to-[var(--secondary-light)] p-6 flex items-end">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md shadow-lg flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              
              <div className="px-6 py-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-[var(--foreground)]">Vocabulary Builder</h3>
                  <span className="text-xs font-medium px-3 py-1 bg-[var(--background)] text-[var(--subtle)] rounded-full">Coming Soon</span>
                </div>
                <p className="mt-4 text-[var(--subtle)]">
                  Industry-specific vocabulary and terminology organized for effective business communication
                </p>
                <div className="mt-6 pt-6 border-t border-[var(--border)]">
                  <p className="text-sm text-[var(--secondary)]">For finance, tech, healthcare, and more</p>
                </div>
              </div>
            </div>
            
            {/* Presentation Coach Card (Coming Soon) */}
            <div className="apple-card bg-white">
              <div className="h-40 bg-gradient-to-r from-[#29cc41] to-[#5ed86c] p-6 flex items-end">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md shadow-lg flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
              </div>
              
              <div className="px-6 py-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-[var(--foreground)]">Presentation Coach</h3>
                  <span className="text-xs font-medium px-3 py-1 bg-[var(--background)] text-[var(--subtle)] rounded-full">Coming Soon</span>
                </div>
                <p className="mt-4 text-[var(--subtle)]">
                  Improve presentation skills for business meetings, sales pitches, and conferences
                </p>
                <div className="mt-6 pt-6 border-t border-[var(--border)]">
                  <p className="text-sm text-[#29cc41]">Real-time feedback and practical exercises</p>
                </div>
              </div>
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
                "B2B Language tools have transformed my teaching. My corporate clients love the customized materials that perfectly match their industry vocabulary and business contexts."
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
