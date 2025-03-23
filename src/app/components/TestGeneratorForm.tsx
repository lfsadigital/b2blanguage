'use client';

import { useState } from 'react';
import { TestFormData, StudentLevel, QuestionType } from '@/app/lib/types';

interface TestGeneratorFormProps {
  onSubmit: (data: TestFormData) => Promise<void>;
  isGenerating: boolean;
}

export default function TestGeneratorForm({ onSubmit, isGenerating }: TestGeneratorFormProps) {
  const [formData, setFormData] = useState<TestFormData>({
    professorName: '',
    studentName: '',
    contentUrl: '',
    studentLevel: 'Beginner',
    questionTypes: ['multiple-choice'], // Default selection
    numberOfQuestions: 5,
    additionalNotes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (type: QuestionType) => {
    setFormData((prev) => {
      // If the type is already selected, remove it, otherwise add it
      const newTypes = prev.questionTypes.includes(type)
        ? prev.questionTypes.filter(t => t !== type)
        : [...prev.questionTypes, type];
      
      // Ensure at least one type is selected
      return {
        ...prev,
        questionTypes: newTypes.length > 0 ? newTypes : prev.questionTypes,
      };
    });
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    
    if (!isNaN(numValue) && numValue > 0 && numValue <= 20) {
      setFormData((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] apple-heading">Create New Test</h3>
          <p className="mt-2 text-sm text-[var(--subtle)]">
            Enter the details below to generate a customized English test
          </p>
        </div>

        <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
          <div>
            <label htmlFor="professorName" className="block text-sm font-medium text-[var(--foreground)]">
              Teacher Name
            </label>
            <div className="mt-1 relative rounded-md">
              <input
                type="text"
                name="professorName"
                id="professorName"
                value={formData.professorName}
                onChange={handleChange}
                className="block w-full rounded-lg border-[var(--border)] focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm py-3 px-4"
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label htmlFor="studentName" className="block text-sm font-medium text-[var(--foreground)]">
              Student Name
            </label>
            <div className="mt-1 relative rounded-md">
              <input
                type="text"
                name="studentName"
                id="studentName"
                value={formData.studentName}
                onChange={handleChange}
                className="block w-full rounded-lg border-[var(--border)] focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm py-3 px-4"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="contentUrl" className="block text-sm font-medium text-[var(--foreground)]">
              Content URL <span className="text-[var(--error)]">*</span>
            </label>
            <div className="mt-1 relative rounded-md">
              <input
                type="url"
                name="contentUrl"
                id="contentUrl"
                value={formData.contentUrl}
                onChange={handleChange}
                required
                className="block w-full rounded-lg border-[var(--border)] focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm py-3 px-4"
                placeholder="YouTube video or article URL"
              />
              <p className="mt-1 text-xs text-[var(--subtle)]">
                Supports YouTube URLs or web articles for business content analysis
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="studentLevel" className="block text-sm font-medium text-[var(--foreground)]">
              Student Level
            </label>
            <div className="mt-1 relative rounded-md">
              <select
                id="studentLevel"
                name="studentLevel"
                value={formData.studentLevel}
                onChange={handleChange}
                className="block w-full rounded-lg border-[var(--border)] focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm py-3 px-4 appearance-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem" }}
              >
                <option value="Beginner">Beginner</option>
                <option value="Medium">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="numberOfQuestions" className="block text-sm font-medium text-[var(--foreground)]">
              Number of Questions
            </label>
            <div className="mt-1 relative rounded-md">
              <input
                type="number"
                name="numberOfQuestions"
                id="numberOfQuestions"
                value={formData.numberOfQuestions}
                onChange={handleNumberChange}
                min="1"
                max="20"
                className="block w-full rounded-lg border-[var(--border)] focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm py-3 px-4"
              />
            </div>
          </div>

          <div className="sm:col-span-2 bg-[var(--background)] p-5 rounded-xl">
            <fieldset>
              <legend className="text-sm font-medium text-[var(--foreground)]">Question Types</legend>
              <div className="mt-4 space-y-3">
                <div className="flex items-center">
                  <input
                    id="multiple-choice"
                    name="questionTypes"
                    type="checkbox"
                    checked={formData.questionTypes.includes('multiple-choice')}
                    onChange={() => handleCheckboxChange('multiple-choice')}
                    className="h-5 w-5 text-[var(--primary)] focus:ring-[var(--primary)] border-[var(--border)] rounded"
                  />
                  <label htmlFor="multiple-choice" className="ml-3">
                    <span className="block text-sm font-medium text-[var(--foreground)]">Multiple Choice</span>
                    <span className="block text-xs text-[var(--subtle)]">Standard format with options</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="open-ended"
                    name="questionTypes"
                    type="checkbox"
                    checked={formData.questionTypes.includes('open-ended')}
                    onChange={() => handleCheckboxChange('open-ended')}
                    className="h-5 w-5 text-[var(--primary)] focus:ring-[var(--primary)] border-[var(--border)] rounded"
                  />
                  <label htmlFor="open-ended" className="ml-3">
                    <span className="block text-sm font-medium text-[var(--foreground)]">Open Ended</span>
                    <span className="block text-xs text-[var(--subtle)]">Free-form responses</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="true-false"
                    name="questionTypes"
                    type="checkbox"
                    checked={formData.questionTypes.includes('true-false')}
                    onChange={() => handleCheckboxChange('true-false')}
                    className="h-5 w-5 text-[var(--primary)] focus:ring-[var(--primary)] border-[var(--border)] rounded"
                  />
                  <label htmlFor="true-false" className="ml-3">
                    <span className="block text-sm font-medium text-[var(--foreground)]">True/False</span>
                    <span className="block text-xs text-[var(--subtle)]">Binary choice questions</span>
                  </label>
                </div>
              </div>
            </fieldset>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="additionalNotes" className="block text-sm font-medium text-[var(--foreground)]">
              Additional Notes
            </label>
            <div className="mt-1 relative rounded-md">
              <textarea
                id="additionalNotes"
                name="additionalNotes"
                rows={3}
                value={formData.additionalNotes}
                onChange={handleChange}
                className="block w-full rounded-lg border-[var(--border)] focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm py-3 px-4"
                placeholder="Any specific requirements or focus areas for this test..."
              />
            </div>
          </div>
        </div>

        <div className="pt-5 flex justify-end">
          <button
            type="submit"
            disabled={isGenerating || !formData.contentUrl}
            className={`apple-button inline-flex items-center px-8 py-3 text-base font-medium ${
              isGenerating || !formData.contentUrl
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Test...
              </>
            ) : (
              'Generate Test'
            )}
          </button>
        </div>
      </div>
    </form>
  );
} 