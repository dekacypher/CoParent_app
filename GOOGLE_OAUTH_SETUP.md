# Google OAuth Integration Setup Guide

This guide walks you through setting up Google Sign-In for the CoParent application.

## Overview

The app uses Google OAuth 2.0 for authentication, integrated with Supabase Auth. The flow works as follows:
1. User clicks "Sign in with Google"
2. Google OAuth popup appears
3. User authenticates with Google
4. Google returns an ID token
5. Token is sent to Supabase for authentication
6. User is logged in and redirected to dashboard

## Prerequisites

- Google Cloud Console account
- Supabase project

## Step 1: Configure Google Cloud Console

### 1.1 Create or Select a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select an existing one

### 1.2 Enable Google+ API

1. Navigate to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click on it and press **Enable**

### 1.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in required fields:
   - App name: `CoParent`
   - User support email: `your-email@example.com`
   - Developer contact: `your-email@example.com`
4. Add scopes (optional for basic sign-in):
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`

### 1.4 Create OAuth 2.0 Client ID

1. Go to **APIs & Services** > **Credentials**
2. Click **+ Create Credentials** > **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `CoParent Web Client`
5. Authorized JavaScript origins:
   ```
   http://localhost:5173
   https://your-production-domain.com
   ```
6. Authorized redirect URIs (leave blank for now - Supabase handles this)
7. Click **Create**
8. **Copy the Client ID** (you'll need it for `.env`)

## Step 2: Configure Supabase for Google OAuth

### 2.1 Enable Google Provider in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list
5. Click to expand and enable it:
   - Toggle **Enable Google provider** to ON
   - Paste your **Google Client ID** from Step 1.4
   - Paste your **Google Client Secret** from Google Cloud Console
6. Click **Save**

### 2.2 Get Supabase Configuration

1. In Supabase Dashboard, go to **Settings** > **API**
2. Copy the following values:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon (public)` key → `VITE_SUPABASE_ANON_KEY`

## Step 3: Configure Environment Variables

Create a `.env` file in the client directory:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-from-supabase-dashboard

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Or copy from `.env.example`:
```bash
cp .env.example .env
```

Then fill in the actual values.

## Step 4: Test the Integration

### 4.1 Start the Development Server

```bash
# In the client directory
cd client
npm run dev
```

### 4.2 Test Google Sign-In

1. Open `http://localhost:5173`
2. Navigate to Login page
3. Click "Sign in with Google"
4. Complete the Google authentication flow
5. Verify you're redirected to the dashboard

## Troubleshooting

### Issue: "Google login failed" error

**Solutions:**
- Verify `VITE_GOOGLE_CLIENT_ID` is correct in `.env`
- Check that Google Client ID is enabled in Google Cloud Console
- Ensure `http://localhost:5173` is in authorized JavaScript origins
- Check browser console for detailed error messages

### Issue: "Provider not enabled" error

**Solutions:**
- Go to Supabase Dashboard > Authentication > Providers
- Ensure Google provider is enabled
- Verify Client ID and Secret are correctly entered

### Issue: Redirect URI mismatch

**Solutions:**
- Supabase automatically handles redirect URIs
- Ensure you're using `signInWithIdToken()` method (already implemented)
- No need to manually configure redirect URIs in Google Cloud Console

### Issue: CORS errors

**Solutions:**
- Verify your origin is in Google Cloud Console authorized origins
- Check that Supabase project allows your domain
- Clear browser cache and try again

## Production Deployment

For production deployment:

1. **Update Google Cloud Console:**
   - Add your production domain to authorized JavaScript origins
   - Example: `https://your-app-domain.com`

2. **Update Supabase:**
   - Add production domain to Site URL in Supabase Dashboard
   - Go to Settings > Authentication > URL Configuration

3. **Update Environment Variables:**
   - Set `VITE_SUPABASE_URL` to production Supabase URL
   - Set `VITE_SUPABASE_ANON_KEY` to production anon key
   - Set `VITE_GOOGLE_CLIENT_ID` to production Google Client ID (or use same one)

## Security Considerations

- Never commit `.env` file to version control
- Use different Client IDs for development and production (optional but recommended)
- Keep Client Secret secure in Supabase (never exposed to client)
- Enable email verification in Supabase if required
- Regularly rotate secrets and update them in both Google Cloud Console and Supabase

## Additional Resources

- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [React OAuth Google](https://www.npmjs.com/package/@react-oauth/google)
