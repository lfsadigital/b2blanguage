import "./globals.css";
import Link from "next/link";
import { Inter } from 'next/font/google';
import { AuthProvider } from '../lib/contexts/AuthContext';
import ProfileIndicator from "../components/ProfileIndicator";
import SignInButton from "../components/SignInButton";
import Logo from "../components/Logo";

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata = {
  title: 'B2B Languages - English Teaching Tools',
  description: 'Professional English language teaching resources for business professionals',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <header className="bg-white border-b border-[var(--border)] sticky top-0 z-10">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <Link 
                    href="/" 
                    className="flex-shrink-0 flex items-center"
                  >
                    <Logo width={100} height={33} />
                    <span className="text-[var(--primary)] font-bold text-2xl ml-2">Languages</span>
                  </Link>
                  <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                    <Link
                      href="/test-generator"
                      className="border-transparent text-[var(--subtle)] hover:text-[var(--primary)] hover:border-[var(--primary)] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                    >
                      Test Generator
                    </Link>
                    <Link
                      href="/class-diary"
                      className="border-transparent text-[var(--subtle)] hover:text-[var(--primary)] hover:border-[var(--primary)] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                    >
                      Class Diary
                    </Link>
                    <Link
                      href="/database"
                      className="border-transparent text-[var(--subtle)] hover:text-[var(--primary)] hover:border-[var(--primary)] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                    >
                      User Database
                    </Link>
                    <Link
                      href="/report"
                      className="border-transparent text-[var(--subtle)] hover:text-[var(--primary)] hover:border-[var(--primary)] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                    >
                      Report
                    </Link>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <SignInButton />
                  <ProfileIndicator />
                </div>
              </div>
            </nav>
          </header>

          <main className="flex-grow">
            {children}
          </main>

          <footer className="bg-[var(--foreground)] text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <div className="flex items-center">
                    <Logo width={100} height={33} variant="light" />
                    <span className="text-white font-bold text-2xl ml-2">Languages</span>
                  </div>
                  <p className="mt-4 text-gray-400">
                    Elevating business professionals through specialized language training
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Tools</h3>
                  <ul className="space-y-2">
                    <li>
                      <Link href="/test-generator" className="text-gray-400 hover:text-white transition-colors">
                        Test Generator
                      </Link>
                    </li>
                    <li>
                      <Link href="/class-diary" className="text-gray-400 hover:text-white transition-colors">
                        Class Diary
                      </Link>
                    </li>
                    <li>
                      <Link href="/database" className="text-gray-400 hover:text-white transition-colors">
                        User Database
                      </Link>
                    </li>
                    <li>
                      <Link href="/report" className="text-gray-400 hover:text-white transition-colors">
                        Report
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Contact</h3>
                  <p className="text-gray-400">
                    info@b2blanguage.com
                  </p>
                  <p className="text-gray-400 mt-2">
                    +1 (555) 123-4567
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                &copy; {new Date().getFullYear()} B2B Languages. All rights reserved.
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
