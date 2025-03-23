'use client';

import { useState } from 'react';
import DashboardShell from '@/components/ui/dashboard-shell';
import TestGeneratorForm from '@/app/components/TestGeneratorForm';
import { TestFormData } from '@/app/lib/types';
import { 
  DocumentTextIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

export default function TestGeneratorPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [testGenerated, setTestGenerated] = useState(false);
  const [currentTab, setCurrentTab] = useState<'test' | 'conversation' | 'teacher-tips'>('test');

  const handleSubmit = async (data: TestFormData) => {
    try {
      setIsGenerating(true);
      // Here would be your API call code
      // For demonstration purposes, we're just adding a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestGenerated(true);
    } catch (error) {
      console.error('Error generating test:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Test & Class Generator</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create custom tests, conversation topics, and teaching tips based on business content
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setCurrentTab('test')}
            className={`${
              currentTab === 'test'
                ? 'border-[#8B4513] text-[#8B4513]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Test Generator
          </button>
          <button
            onClick={() => setCurrentTab('conversation')}
            className={`${
              currentTab === 'conversation'
                ? 'border-[#8B4513] text-[#8B4513]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
            Conversation Topics
          </button>
          <button
            onClick={() => setCurrentTab('teacher-tips')}
            className={`${
              currentTab === 'teacher-tips'
                ? 'border-[#8B4513] text-[#8B4513]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <LightBulbIcon className="h-5 w-5 mr-2" />
            Teacher Tips
          </button>
        </nav>
      </div>

      {/* Main content based on tab */}
      <div className="bg-white shadow rounded-lg p-6">
        {currentTab === 'test' && (
          <>
            {!testGenerated ? (
              <TestGeneratorForm onSubmit={handleSubmit} isGenerating={isGenerating} />
            ) : (
              <div className="test-results space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-800">Generated Test</h3>
                  <button
                    onClick={() => setTestGenerated(false)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513]"
                  >
                    Create New Test
                  </button>
                </div>
                
                {/* Mock test result UI */}
                <div className="p-6 bg-[#FFF8DC] rounded-lg border border-[#DEB887] space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-lg font-medium text-[#8B4513]">Question 1</h4>
                    <p className="text-gray-900">What is the main benefit of using AI in business operations?</p>
                    <div className="ml-4 space-y-2 mt-4">
                      <div className="flex items-start">
                        <input type="radio" id="q1a" name="q1" className="mt-1 h-4 w-4 text-[#8B4513] focus:ring-[#8B4513] border-gray-300" />
                        <label htmlFor="q1a" className="ml-2 block text-gray-700">A) Reducing human workload</label>
                      </div>
                      <div className="flex items-start">
                        <input type="radio" id="q1b" name="q1" className="mt-1 h-4 w-4 text-[#8B4513] focus:ring-[#8B4513] border-gray-300" />
                        <label htmlFor="q1b" className="ml-2 block text-gray-700">B) Increasing operational efficiency</label>
                      </div>
                      <div className="flex items-start">
                        <input type="radio" id="q1c" name="q1" className="mt-1 h-4 w-4 text-[#8B4513] focus:ring-[#8B4513] border-gray-300" />
                        <label htmlFor="q1c" className="ml-2 block text-gray-700">C) Complete automation of all tasks</label>
                      </div>
                      <div className="flex items-start">
                        <input type="radio" id="q1d" name="q1" className="mt-1 h-4 w-4 text-[#8B4513] focus:ring-[#8B4513] border-gray-300" />
                        <label htmlFor="q1d" className="ml-2 block text-gray-700">D) Eliminating the need for strategic planning</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-lg font-medium text-[#8B4513]">Question 2</h4>
                    <p className="text-gray-900">Which of the following is true about digital transformation?</p>
                    <div className="ml-4 space-y-2 mt-4">
                      <div className="flex items-start">
                        <input type="radio" id="q2a" name="q2" className="mt-1 h-4 w-4 text-[#8B4513] focus:ring-[#8B4513] border-gray-300" />
                        <label htmlFor="q2a" className="ml-2 block text-gray-700">A) It only affects the IT department</label>
                      </div>
                      <div className="flex items-start">
                        <input type="radio" id="q2b" name="q2" className="mt-1 h-4 w-4 text-[#8B4513] focus:ring-[#8B4513] border-gray-300" />
                        <label htmlFor="q2b" className="ml-2 block text-gray-700">B) It requires cultural change throughout an organization</label>
                      </div>
                      <div className="flex items-start">
                        <input type="radio" id="q2c" name="q2" className="mt-1 h-4 w-4 text-[#8B4513] focus:ring-[#8B4513] border-gray-300" />
                        <label htmlFor="q2c" className="ml-2 block text-gray-700">C) It's a one-time project with clear endpoints</label>
                      </div>
                      <div className="flex items-start">
                        <input type="radio" id="q2d" name="q2" className="mt-1 h-4 w-4 text-[#8B4513] focus:ring-[#8B4513] border-gray-300" />
                        <label htmlFor="q2d" className="ml-2 block text-gray-700">D) It only applies to large enterprises</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-lg font-medium text-[#8B4513]">Question 3</h4>
                    <p className="text-gray-900">True or False: Cloud computing always reduces operational costs.</p>
                    <div className="ml-4 space-y-2 mt-4">
                      <div className="flex items-start">
                        <input type="radio" id="q3a" name="q3" className="mt-1 h-4 w-4 text-[#8B4513] focus:ring-[#8B4513] border-gray-300" />
                        <label htmlFor="q3a" className="ml-2 block text-gray-700">True</label>
                      </div>
                      <div className="flex items-start">
                        <input type="radio" id="q3b" name="q3" className="mt-1 h-4 w-4 text-[#8B4513] focus:ring-[#8B4513] border-gray-300" />
                        <label htmlFor="q3b" className="ml-2 block text-gray-700">False</label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#8B4513] hover:bg-[#A0522D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513]"
                  >
                    Download Test
                  </button>
                  <button
                    className="inline-flex items-center px-4 py-2 border border-[#8B4513] text-sm font-medium rounded-md text-[#8B4513] bg-white hover:bg-[#FFF8DC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B4513]"
                  >
                    Print Test
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        
        {currentTab === 'conversation' && (
          <div className="space-y-6">
            <p className="text-gray-700">
              Generate conversation topics and questions based on business content to help your students practice their speaking skills.
            </p>
            
            {/* We would reuse similar form logic as the test generator */}
            <div className="bg-[#FFF8DC] p-6 rounded-lg border border-[#DEB887]">
              <h3 className="text-lg font-medium text-[#8B4513] mb-4">Sample Conversation Topics</h3>
              <ul className="space-y-4">
                <li className="flex gap-2">
                  <span className="text-[#8B4513] font-medium">1.</span>
                  <span className="text-gray-800">Discuss the challenges businesses face when implementing digital transformation strategies.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#8B4513] font-medium">2.</span>
                  <span className="text-gray-800">How does artificial intelligence change the way companies approach customer service?</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#8B4513] font-medium">3.</span>
                  <span className="text-gray-800">Compare and contrast remote work policies before and after the pandemic.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#8B4513] font-medium">4.</span>
                  <span className="text-gray-800">What skills do you think will be most valuable for business professionals in the next decade?</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#8B4513] font-medium">5.</span>
                  <span className="text-gray-800">How might blockchain technology impact international business transactions?</span>
                </li>
              </ul>
            </div>
          </div>
        )}
        
        {currentTab === 'teacher-tips' && (
          <div className="space-y-6">
            <p className="text-gray-700">
              Get teaching tips and suggestions tailored to the content you're using in your business English classes.
            </p>
            
            <div className="bg-[#FFF8DC] p-6 rounded-lg border border-[#DEB887] space-y-4">
              <h3 className="text-lg font-medium text-[#8B4513]">Teaching Tips</h3>
              
              <div>
                <h4 className="font-medium text-gray-900">Vocabulary Focus</h4>
                <p className="text-gray-800 mt-1">
                  Pre-teach key business terminology related to digital transformation: automation, implementation, scalability, integration, etc.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Discussion Strategy</h4>
                <p className="text-gray-800 mt-1">
                  Use the "think-pair-share" technique for complex topics. Have students think individually, discuss in pairs, then share with the class.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Activity Suggestion</h4>
                <p className="text-gray-800 mt-1">
                  Role play a business meeting where students must pitch a new technology solution to management, focusing on proper use of persuasive language.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Follow-up Assignment</h4>
                <p className="text-gray-800 mt-1">
                  Ask students to research a company that successfully implemented digital transformation and prepare a brief case study presentation.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
} 