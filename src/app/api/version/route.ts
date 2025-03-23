import { NextResponse } from 'next/server';
import { getVersionInfo } from '@/app/version';

// This API endpoint helps verify which code version is deployed
export async function GET() {
  const versionInfo = getVersionInfo();
  
  // Add runtime info to help diagnose issues
  const runtimeInfo = {
    nodeVersion: process.version,
    environment: process.env.NODE_ENV,
    platform: process.platform,
    timestamp: new Date().toISOString(),
    deployTimestamp: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
  };
  
  return NextResponse.json({
    success: true,
    message: 'Version info retrieved successfully',
    versionInfo,
    runtimeInfo,
    buildDate: new Date().toISOString(),
  });
} 