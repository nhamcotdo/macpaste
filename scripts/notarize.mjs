import { notarize } from '@electron/notarize';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * afterSign hook for electron-builder.
 * Notarizes the macOS .app bundle with Apple's notary service.
 *
 * Required environment variables (set as GitHub Actions secrets):
 *   APPLE_ID                  — Your Apple developer account email
 *   APPLE_APP_SPECIFIC_PASSWORD — App-specific password from appleid.apple.com
 *   APPLE_TEAM_ID             — Your 10-character Team ID from developer.apple.com
 */
export default async function notarizeApp(context) {
  const { electronPlatformName, appOutDir } = context;

  // Only notarize on macOS builds
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // Skip if code signing is disabled (e.g., local builds without certs)
  if (process.env.CSC_IDENTITY_AUTO_DISCOVERY === 'false') {
    console.log('Skipping notarization: CSC_IDENTITY_AUTO_DISCOVERY is false');
    return;
  }

  const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID } = process.env;

  if (!APPLE_ID || !APPLE_APP_SPECIFIC_PASSWORD || !APPLE_TEAM_ID) {
    console.warn(
      'Skipping notarization: APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, or APPLE_TEAM_ID not set'
    );
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`Notarizing ${appPath} with Apple ID ${APPLE_ID}...`);

  await notarize({
    tool: 'notarytool',
    appPath,
    appleId: APPLE_ID,
    appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
    teamId: APPLE_TEAM_ID,
  });

  console.log('Notarization complete.');
}
