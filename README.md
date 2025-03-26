# B2B Languages - English Teaching Tools

A Next.js application for professional English language teaching resources targeted at business professionals.

## Features

- **Test Generator**: Create custom English language tests with various question types
- **Class Diary**: Manage student records, track progress, and upload test results
- **User Authentication**: Firebase authentication with profile types (Visitor, Owner, Manager, Teacher, Student)
- **Profile Indicator**: Shows the current user's profile type in the top right corner of every page

## Test Features

- Tests are generated with a grade input area in the top right corner
- Tests can be printed or saved as PDFs

## Class Diary Features

- Teacher can record class details and test results
- Upload test files with grades
- Track student progress over time
- Input fields for teacher name, student name, date, and grades

## Profile Types

- **Visitor**: Default profile type for newly registered users
- **Owner**: Site owner with full access
- **Manager**: School manager with administrative rights
- **Teacher**: Can create tests and manage student records
- **Student**: Can view their own records and tests

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Technologies used
This doesn't really matter, but is useful for the AI to understand more about this project. We are using the following technologies
- React with Next.js 14 App Router
- TailwindCSS
- Firebase Auth, Storage, and Database
- Multiple AI endpoints including OpenAI, Anthropic, and Replicate using Vercel's AI SDK