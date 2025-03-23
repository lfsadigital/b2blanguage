/**
 * VERSION MARKER
 * This file helps verify which code version is deployed
 * 
 * CURRENT VERSION: 1.2.1-debug-2024-03-23-TIMESTAMP-${Date.now()}
 * 
 * Force build marker: FORCE-REBUILD-NOW
 */

export const VERSION = '1.2.1-debug-2024-03-23';
export const BUILD_TIMESTAMP = '${Date.now()}';
export const FULL_VERSION = `${VERSION}-${BUILD_TIMESTAMP}`;

// This function is used to verify which code version is deployed
export function getVersionInfo() {
  return {
    version: VERSION,
    buildTimestamp: BUILD_TIMESTAMP,
    fullVersion: FULL_VERSION,
    buildDate: new Date().toISOString(),
  };
} 