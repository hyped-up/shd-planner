# Google Drive Integration Setup

Step-by-step instructions for connecting SHD Planner to Google Drive for build backup and sync.

## Prerequisites

- A Google account
- Access to the [Google Cloud Console](https://console.cloud.google.com/)

## 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** in the top navigation bar
3. Click **New Project**
4. Enter a project name (e.g., `SHD Planner`)
5. Click **Create**
6. Select the new project from the project dropdown

## 2. Enable the Google Drive API

1. In the Cloud Console, go to **APIs & Services > Library**
2. Search for `Google Drive API`
3. Click on **Google Drive API** in the results
4. Click **Enable**

## 3. Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** user type (unless you have a Google Workspace organization)
3. Click **Create**
4. Fill in the required fields:
   - **App name:** `SHD Planner`
   - **User support email:** Your email address
   - **Developer contact information:** Your email address
5. Click **Save and Continue**
6. On the **Scopes** page, click **Add or Remove Scopes**
7. Search for and select `https://www.googleapis.com/auth/drive.file`
   - This scope only allows access to files created by the app, not your entire Drive
8. Click **Update**, then **Save and Continue**
9. On the **Test users** page, click **Add Users**
10. Enter your Google account email, then click **Add**
11. Click **Save and Continue**

## 4. Create OAuth2 Web Application Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Select **Web application** as the Application type
4. Enter a name (e.g., `SHD Planner Web Client`)
5. Under **Authorized redirect URIs**, click **Add URI**
6. Enter: `http://localhost:3000/api/auth/google/callback`
7. Click **Create**
8. A dialog will display your **Client ID** and **Client Secret** -- save both values

## 5. Set the Redirect URI

For local development, the redirect URI should be:

```
http://localhost:3000/api/auth/google/callback
```

For production, update this to your deployed URL:

```
https://your-domain.com/api/auth/google/callback
```

Make sure the redirect URI in your `.env` file matches exactly what you configured in the Google Cloud Console.

## 6. Copy Credentials to .env

Open your `.env` file (copy from `.env.example` if it does not exist) and fill in the Google OAuth values:

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

Do not commit the `.env` file to version control. It is already listed in `.gitignore`.

## 7. Test the Connection

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Settings page in the app

3. Click **Connect Google Drive**

4. You will be redirected to Google's OAuth consent screen

5. Sign in with the Google account you added as a test user (Step 3.10)

6. Grant the requested permission (`See, edit, create, and delete only the specific Google Drive files you use with this app`)

7. You will be redirected back to the Settings page with a success message

8. Verify the connection by exporting a build to Google Drive:
   - Open a build
   - Use the export option to save it to Drive
   - Check your Google Drive for a new `SHD-Planner` folder with a `Builds` subfolder

## Troubleshooting

### "Google OAuth is not configured"
- Verify all three environment variables are set in `.env`
- Restart the development server after changing `.env`

### "Invalid state parameter"
- This is a CSRF protection error. Try connecting again from the Settings page
- Clear your browser cookies for `localhost:3000` and retry

### "Access blocked: This app's request is invalid" (redirect_uri_mismatch)
- The redirect URI in `.env` must exactly match the one configured in the Google Cloud Console
- Check for trailing slashes, port numbers, and http vs https

### "Access denied" after consent
- Make sure your Google account is added as a test user in the OAuth consent screen configuration
- If the app is in "Testing" mode, only test users can authorize

### Token expired
- Access tokens expire after 1 hour
- The app stores a refresh token to automatically obtain new access tokens
- If the refresh token is lost, disconnect and reconnect Google Drive

## Folder Structure

When connected, SHD Planner creates the following folder structure in your Google Drive:

```
SHD-Planner/
  Builds/
    index.json          (manifest of all exported builds)
    My_DPS_Build.json   (individual build files)
    Tank_Build.json
  Game-Data/
    manifest.json       (data version info)
    brand_sets.json     (game data files)
    gear_sets.json
    ...
```

The `drive.file` scope means the app can only access files and folders it created -- it cannot read or modify any other files in your Google Drive.
