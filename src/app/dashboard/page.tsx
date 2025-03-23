'use client';

import React from 'react';
import DashboardShell from '@/components/ui/dashboard-shell';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  UserGroupIcon,
  PresentationChartBarIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  return (
    <DashboardShell>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-600">
        Welcome to your B2B Language teaching dashboard
      </p>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard 
          title="Total Classes" 
          value="24" 
          icon={<PresentationChartBarIcon className="h-6 w-6 text-[#8B4513]" />}
          change="+12%" 
          trend="up" 
        />
        <StatsCard 
          title="Total Students" 
          value="38" 
          icon={<UserGroupIcon className="h-6 w-6 text-[#8B4513]" />}
          change="+5%" 
          trend="up" 
        />
        <StatsCard 
          title="Tests Generated" 
          value="56" 
          icon={<DocumentTextIcon className="h-6 w-6 text-[#8B4513]" />}
          change="+18%" 
          trend="up" 
        />
      </div>

      {/* Recent Activities */}
      <h2 className="mt-8 text-lg font-medium text-gray-900">Recent Activity</h2>
      <div className="mt-3 bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {activities.map((activity, index) => (
            <ActivityItem key={index} activity={activity} />
          ))}
        </ul>
      </div>

      {/* Quick Access */}
      <h2 className="mt-8 text-lg font-medium text-gray-900">Quick Access</h2>
      <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {quickAccess.map((item, index) => (
          <QuickAccessCard key={index} item={item} />
        ))}
      </div>
    </DashboardShell>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change: string;
  trend: 'up' | 'down';
}

function StatsCard({ title, value, icon, change, trend }: StatsCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <span className={`inline-flex items-center text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? (
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mr-1" />
            ) : (
              <ArrowTrendingUpIcon className="h-5 w-5 text-red-500 mr-1 transform rotate-180" />
            )}
            {change}
          </span>
        </div>
      </div>
    </div>
  );
}

interface Activity {
  type: string;
  title: string;
  time: string;
  description: string;
}

const activities: Activity[] = [
  {
    type: 'test',
    title: 'Business English Test Generated',
    time: '2 hours ago',
    description: 'You generated a new test about Marketing Strategies',
  },
  {
    type: 'class',
    title: 'Class Completed',
    time: '1 day ago',
    description: 'You completed a class with Team Alpha',
  },
  {
    type: 'student',
    title: 'Student Progress Updated',
    time: '2 days ago',
    description: 'You updated John Smith\'s progress report',
  },
];

function ActivityItem({ activity }: { activity: Activity }) {
  return (
    <li>
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#8B4513] truncate">
            {activity.title}
          </p>
          <div className="ml-2 flex-shrink-0 flex">
            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#F5DEB3] text-[#8B4513]">
              {activity.time}
            </p>
          </div>
        </div>
        <div className="mt-2 sm:flex sm:justify-between">
          <div className="sm:flex">
            <p className="text-sm text-gray-500">
              {activity.description}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}

interface QuickAccessItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

const quickAccess: QuickAccessItem[] = [
  {
    title: 'Create a New Test',
    description: 'Generate vocabulary, grammar, or business English tests',
    icon: <DocumentTextIcon className="h-6 w-6 text-[#8B4513]" />,
    href: '/test-generator',
  },
  {
    title: 'View Analytics',
    description: 'See student performance and engagement metrics',
    icon: <ChartBarIcon className="h-6 w-6 text-[#8B4513]" />,
    href: '#',
  },
  {
    title: 'Manage Billing',
    description: 'View your subscription status and billing history',
    icon: <BanknotesIcon className="h-6 w-6 text-[#8B4513]" />,
    href: '#',
  },
];

function QuickAccessCard({ item }: { item: QuickAccessItem }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {item.icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <h3 className="text-base font-medium text-gray-900">{item.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{item.description}</p>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3 flex justify-end">
        <a
          href={item.href}
          className="text-sm font-medium text-[#8B4513] hover:text-[#A0522D]"
        >
          Go →
        </a>
      </div>
    </div>
  );
} 