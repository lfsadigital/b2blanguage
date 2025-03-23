'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { Dialog, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  DocumentTextIcon,
  BookOpenIcon,
  UserGroupIcon,
  BeakerIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 flex z-40 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#8B4513]"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <h1 className="text-xl font-bold text-[#8B4513]">B2B Language</h1>
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  <SidebarItems />
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <a href="#" className="flex-shrink-0 group block">
                  <div className="flex items-center">
                    <div>
                      <UserCircleIcon className="h-9 w-9 text-[#8B4513]" />
                    </div>
                    <div className="ml-3">
                      <p className="text-base font-medium text-gray-700 group-hover:text-[#8B4513]">
                        Teacher Account
                      </p>
                      <p className="text-sm font-medium text-gray-500 group-hover:text-[#A0522D]">
                        View profile
                      </p>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </Transition.Child>
          <div className="flex-shrink-0 w-14">{/* Force sidebar to shrink to fit close icon */}</div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-[#8B4513]">B2B Language</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                <SidebarItems />
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <a href="#" className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div>
                    <UserCircleIcon className="h-9 w-9 text-[#8B4513]" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-[#8B4513]">
                      Teacher Account
                    </p>
                    <p className="text-xs font-medium text-gray-500 group-hover:text-[#A0522D]">
                      View profile
                    </p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#8B4513]"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarItems() {
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: true },
    { name: 'Test Generator', href: '/test-generator', icon: DocumentTextIcon, current: false },
    { name: 'Class Diary', href: '#', icon: BookOpenIcon, current: false },
    { name: 'Database', href: '#', icon: UserGroupIcon, current: false },
    { name: 'Experiments', href: '#', icon: BeakerIcon, current: false },
  ];

  return (
    <>
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={`
            group flex items-center px-2 py-2 text-sm font-medium rounded-md 
            ${item.current
              ? 'bg-[#F5DEB3] text-[#8B4513]'
              : 'text-gray-600 hover:bg-[#F5F5DC] hover:text-[#8B4513]'
            }
          `}
        >
          <item.icon
            className={`
              mr-3 h-6 w-6 
              ${item.current
                ? 'text-[#8B4513]'
                : 'text-gray-400 group-hover:text-[#8B4513]'
              }
            `}
            aria-hidden="true"
          />
          {item.name}
        </Link>
      ))}
      <div className="pt-4 pb-3">
        <div className="border-t border-gray-200" />
      </div>
      <a
        href="#"
        className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50"
      >
        <ArrowRightOnRectangleIcon className="mr-3 h-6 w-6 text-red-400 group-hover:text-red-500" aria-hidden="true" />
        Logout
      </a>
    </>
  );
} 