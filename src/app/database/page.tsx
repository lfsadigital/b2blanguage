'use client';

import { useState } from 'react';
import DashboardShell from '@/components/ui/dashboard-shell';
import { 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  ChartBarIcon,
  BookmarkIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  TagIcon,
  StarIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';

// Mock data for the business content database
const mockResources = [
  {
    id: '1',
    title: 'How Digital Transformation is Reshaping Business Models',
    type: 'article',
    source: 'Harvard Business Review',
    date: '2023-02-15',
    level: 'Advanced',
    topics: ['digital transformation', 'business strategy', 'innovation'],
    saved: true,
    image: 'https://source.unsplash.com/random/300x200?digital'
  },
  {
    id: '2',
    title: 'Effective Business Communication in Virtual Environments',
    type: 'video',
    source: 'TED Talks',
    date: '2023-01-20',
    level: 'Intermediate',
    topics: ['communication', 'remote work', 'team management'],
    saved: false,
    image: 'https://source.unsplash.com/random/300x200?communication'
  },
  {
    id: '3',
    title: 'Financial Planning for Small Businesses: A Beginner\'s Guide',
    type: 'article',
    source: 'Entrepreneur',
    date: '2023-02-28',
    level: 'Beginner',
    topics: ['finance', 'small business', 'planning'],
    saved: true,
    image: 'https://source.unsplash.com/random/300x200?finance'
  },
  {
    id: '4',
    title: 'The Impact of Artificial Intelligence on Customer Service',
    type: 'video',
    source: 'YouTube',
    date: '2023-01-05',
    level: 'Intermediate',
    topics: ['AI', 'customer service', 'technology'],
    saved: false,
    image: 'https://source.unsplash.com/random/300x200?ai'
  },
  {
    id: '5',
    title: 'Understanding Global Market Trends',
    type: 'presentation',
    source: 'McKinsey & Company',
    date: '2023-02-01',
    level: 'Advanced',
    topics: ['market trends', 'global business', 'analytics'],
    saved: false,
    image: 'https://source.unsplash.com/random/300x200?market'
  },
  {
    id: '6',
    title: 'Building Resilient Supply Chains in Uncertain Times',
    type: 'article',
    source: 'Forbes',
    date: '2023-03-01',
    level: 'Intermediate',
    topics: ['supply chain', 'risk management', 'logistics'],
    saved: true,
    image: 'https://source.unsplash.com/random/300x200?supply'
  }
];

export default function DatabasePage() {
  const [resources, setResources] = useState(mockResources);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilters, setActiveFilters] = useState<{
    types: string[];
    levels: string[];
    topics: string[];
  }>({
    types: [],
    levels: [],
    topics: []
  });
  const [showFilters, setShowFilters] = useState(false);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Filter resources based on search term and active filters
  const filteredResources = resources.filter(resource => {
    // Search term filter
    const matchesSearch = 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Type filter
    const matchesType = activeFilters.types.length === 0 || 
      activeFilters.types.includes(resource.type);
    
    // Level filter
    const matchesLevel = activeFilters.levels.length === 0 || 
      activeFilters.levels.includes(resource.level);
    
    // Topic filter
    const matchesTopic = activeFilters.topics.length === 0 || 
      resource.topics.some(topic => activeFilters.topics.includes(topic));
    
    return matchesSearch && matchesType && matchesLevel && matchesTopic;
  });

  // Toggle filter
  const toggleFilter = (filterType: 'types' | 'levels' | 'topics', value: string) => {
    setActiveFilters(prev => {
      const currentFilters = [...prev[filterType]];
      const index = currentFilters.indexOf(value);
      
      if (index === -1) {
        currentFilters.push(value);
      } else {
        currentFilters.splice(index, 1);
      }
      
      return {
        ...prev,
        [filterType]: currentFilters
      };
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters({
      types: [],
      levels: [],
      topics: []
    });
    setSearchTerm('');
  };

  // Toggle bookmark/save
  const toggleSaved = (id: string) => {
    setResources(prev => 
      prev.map(resource => 
        resource.id === id 
          ? {...resource, saved: !resource.saved} 
          : resource
      )
    );
  };

  // Get all unique values for filter options
  const allTypes = Array.from(new Set(resources.map(r => r.type)));
  const allLevels = Array.from(new Set(resources.map(r => r.level)));
  const allTopics = Array.from(
    new Set(resources.flatMap(r => r.topics))
  );

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Business Content Database</h1>
        <p className="mt-1 text-sm text-gray-600">
          Access business articles, videos, and resources for your English lessons
        </p>
      </div>

      {/* Search and filters */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center mb-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="search"
              placeholder="Search articles, videos, and topics..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-[#8B4513] focus:border-[#8B4513] sm:text-sm"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          
          <div className="flex items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513]"
            >
              <FunnelIcon className="-ml-0.5 mr-2 h-4 w-4" />
              Filters {activeFilters.types.length > 0 || activeFilters.levels.length > 0 || activeFilters.topics.length > 0 ? `(${activeFilters.types.length + activeFilters.levels.length + activeFilters.topics.length})` : ''}
            </button>
            
            <div className="ml-4 border-l pl-4 border-gray-300">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-100 text-[#8B4513]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ml-2 ${viewMode === 'list' ? 'bg-gray-100 text-[#8B4513]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Filter panels */}
        {showFilters && (
          <div className="border-t border-gray-200 pt-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Content Type Filter */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Content Type</h3>
                <div className="space-y-2">
                  {allTypes.map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-[#8B4513] focus:ring-[#8B4513] border-gray-300 rounded"
                        checked={activeFilters.types.includes(type)}
                        onChange={() => toggleFilter('types', type)}
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Level Filter */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Level</h3>
                <div className="space-y-2">
                  {allLevels.map(level => (
                    <label key={level} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-[#8B4513] focus:ring-[#8B4513] border-gray-300 rounded"
                        checked={activeFilters.levels.includes(level)}
                        onChange={() => toggleFilter('levels', level)}
                      />
                      <span className="ml-2 text-sm text-gray-700">{level}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Topics Filter */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Topics</h3>
                <div className="grid grid-cols-2 gap-2">
                  {allTopics.slice(0, 6).map(topic => (
                    <label key={topic} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-[#8B4513] focus:ring-[#8B4513] border-gray-300 rounded"
                        checked={activeFilters.topics.includes(topic)}
                        onChange={() => toggleFilter('topics', topic)}
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{topic}</span>
                    </label>
                  ))}
                </div>
                {allTopics.length > 6 && (
                  <button className="text-xs text-[#8B4513] mt-2 hover:underline">
                    Show more topics ({allTopics.length - 6})
                  </button>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content grid/list */}
      {filteredResources.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map(resource => (
              <div key={resource.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 bg-gray-200 relative">
                  <img
                    src={resource.image}
                    alt={resource.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => toggleSaved(resource.id)}
                      className={`p-1.5 rounded-full ${resource.saved ? 'bg-[#8B4513] text-white' : 'bg-white/80 text-gray-700 hover:bg-white'}`}
                    >
                      <BookmarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <span className={`px-2 py-1 text-xs rounded-md ${
                      resource.type === 'article' ? 'bg-blue-100 text-blue-800' : 
                      resource.type === 'video' ? 'bg-red-100 text-red-800' : 
                      'bg-purple-100 text-purple-800'
                    } flex items-center`}>
                      {resource.type === 'article' && <DocumentTextIcon className="h-3 w-3 mr-1" />}
                      {resource.type === 'video' && <VideoCameraIcon className="h-3 w-3 mr-1" />}
                      {resource.type === 'presentation' && <ChartBarIcon className="h-3 w-3 mr-1" />}
                      {resource.type}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">{resource.date}</span>
                  </div>
                  <h3 className="text-base font-medium text-gray-900 line-clamp-2 mb-1">{resource.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{resource.source}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {resource.topics.slice(0, 2).map(topic => (
                      <span key={topic} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#FFF8DC] text-[#8B4513]">
                        <TagIcon className="h-3 w-3 mr-1" />
                        {topic}
                      </span>
                    ))}
                    {resource.topics.length > 2 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        +{resource.topics.length - 2}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-medium ${
                      resource.level === 'Beginner' ? 'text-green-600' : 
                      resource.level === 'Intermediate' ? 'text-yellow-600' : 
                      'text-blue-600'
                    }`}>
                      {resource.level}
                    </span>
                    <div className="space-x-2">
                      <button className="p-1 text-gray-400 hover:text-[#8B4513]">
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-[#8B4513]">
                        <ShareIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {filteredResources.map(resource => (
                <li key={resource.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-md ${
                          resource.type === 'article' ? 'bg-blue-100 text-blue-800' : 
                          resource.type === 'video' ? 'bg-red-100 text-red-800' : 
                          'bg-purple-100 text-purple-800'
                        } flex items-center`}>
                          {resource.type === 'article' && <DocumentTextIcon className="h-3 w-3 mr-1" />}
                          {resource.type === 'video' && <VideoCameraIcon className="h-3 w-3 mr-1" />}
                          {resource.type === 'presentation' && <ChartBarIcon className="h-3 w-3 mr-1" />}
                          {resource.type}
                        </span>
                        <span className="text-xs text-gray-500">{resource.date}</span>
                        <span className={`text-xs font-medium ${
                          resource.level === 'Beginner' ? 'text-green-600' : 
                          resource.level === 'Intermediate' ? 'text-yellow-600' : 
                          'text-blue-600'
                        }`}>
                          {resource.level}
                        </span>
                      </div>
                      <h3 className="mt-1 text-base font-medium text-gray-900">{resource.title}</h3>
                      <p className="text-sm text-gray-500">{resource.source}</p>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {resource.topics.map(topic => (
                          <span key={topic} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#FFF8DC] text-[#8B4513]">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-start ml-4 space-x-2">
                      <button
                        onClick={() => toggleSaved(resource.id)}
                        className={`p-1.5 rounded-full ${resource.saved ? 'text-[#8B4513]' : 'text-gray-400 hover:text-[#8B4513]'}`}
                      >
                        <BookmarkIcon className="h-5 w-5" />
                      </button>
                      <button className="p-1.5 rounded-full text-gray-400 hover:text-[#8B4513]">
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                      <button className="p-1.5 rounded-full text-gray-400 hover:text-[#8B4513]">
                        <ShareIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or filters to find what you're looking for.</p>
          <button
            onClick={clearFilters}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#8B4513] hover:bg-[#A0522D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513]"
          >
            Clear all filters
          </button>
        </div>
      )}
    </DashboardShell>
  );
} 