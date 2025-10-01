# OAuth Social Login Setup Guide

This guide walks you through configuring Google and GitHub OAuth for social login in WIGG.

## Prerequisites

- [ ] Supabase project set up and running
- [ ] Access to Supabase Dashboard
- [ ] Google Cloud Console account (for Google OAuth)
- [ ] GitHub account (for GitHub OAuth)

---

## Step 1: Find Your Supabase Project Reference

Your OAuth callback URL requires your Supabase project reference.

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your WIGG project
3. Go to **Settings** → **API**
4. Find your **Project URL**: `https://YOUR_PROJECT_REF.supabase.co`
5. Note down `YOUR_PROJECT_REF` (e.g., `abcdefghijklmnop`)

**Your callback URL will be:**
```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

---

## Step 2: Configure Google OAuth

### 2.1 Create OAuth App in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Select or create a project** (top-left dropdown)
3. Navigate to **"APIs & Services"** → **"Credentials"** (left sidebar)
4. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**

### 2.2 Configure OAuth Consent Screen (if prompted)

1. Choose **"External"** (unless you have Google Workspace)
2. Fill in required fields:
   - **App name**: "WIGG"
   - **User support email**: Your email
   - **Developer contact email**: Your email
3. Click **"Save and Continue"** through all screens
4. On Scopes page, click **"Save and Continue"** (no additional scopes needed)
5. On Test users page, click **"Save and Continue"**
6. Click **"Back to Dashboard"**

### 2.3 Create OAuth Client ID

1. Back in **Credentials**, click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
2. **Application type**: Web application
3. **Name**: "WIGG Web App"
4. **Authorized JavaScript origins**:
   ```
   http://localhost:8080
   https://wigg.app
   ```
   *(Replace `wigg.app` with your production domain)*

5. **Authorized redirect URIs** (CRITICAL):
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   http://localhost:8080
   ```
   *(Replace `YOUR_PROJECT_REF` with your actual Supabase project reference)*

6. Click **"CREATE"**
7. **COPY** the **Client ID** and **Client secret** from the modal

### 2.4 Add Credentials to Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/YOUR_PROJECT/auth/providers)
2. Find **"Google"** in the providers list
3. Toggle **"Google Enabled"** to ON
4. Paste:
   - **Client ID** (from Google)
   - **Client Secret** (from Google)
5. Click **"Save"**

---

## Step 3: Configure GitHub OAuth

### 3.1 Create OAuth App in GitHub

1. Go to [GitHub Settings → Developer Settings](https://github.com/settings/developers)
2. Click **"OAuth Apps"** (left sidebar)
3. Click **"New OAuth App"** (or "Register a new application")
4. Fill in the form:
   - **Application name**: "WIGG"
   - **Homepage URL**: `https://wigg.app` (or `http://localhost:8080` for dev)
   - **Application description**: (optional) "Track when media gets good"
   - **Authorization callback URL** (CRITICAL):
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     *(Replace `YOUR_PROJECT_REF` with your actual Supabase project reference)*

5. Click **"Register application"**

### 3.2 Generate Client Secret

1. On the OAuth app page, **copy the Client ID** (shown at top)
2. Click **"Generate a new client secret"**
3. **COPY the Client Secret** immediately (shown only once!)

### 3.3 Add Credentials to Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/YOUR_PROJECT/auth/providers)
2. Find **"GitHub"** in the providers list
3. Toggle **"GitHub Enabled"** to ON
4. Paste:
   - **Client ID** (from GitHub)
   - **Client Secret** (from GitHub)
5. Click **"Save"**

---

## Step 4: Test OAuth Flow

### 4.1 Local Testing

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:8080/auth`
3. Click **"Google"** button
4. Verify:
   - [ ] Redirects to Google OAuth consent screen
   - [ ] After approval, redirects back to app
   - [ ] Lands on `/dashboard`
   - [ ] User is authenticated (Profile button appears in header)

5. Sign out and test **"GitHub"** button
6. Verify same flow works for GitHub

### 4.2 Production Testing

1. Deploy to production (Vercel/Netlify/etc.)
2. Update OAuth app redirect URIs to include production domain:
   - **Google**: Add `https://your-domain.com` to authorized origins
   - **GitHub**: Update Homepage URL to production domain
3. Test OAuth flow on production

---

## Step 5: Security & Production Checklist

- [ ] OAuth secrets stored securely in Supabase (never in code)
- [ ] Callback URLs use HTTPS in production
- [ ] Google OAuth consent screen configured with privacy policy (if publishing)
- [ ] GitHub OAuth app uses production homepage URL
- [ ] Test OAuth with multiple accounts
- [ ] Verify user profile creation works for new OAuth users
- [ ] Test sign out and re-authentication

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Problem**: The redirect URI doesn't match what's configured in OAuth app

**Solution**:
1. Check your Supabase project reference is correct
2. Verify callback URL in Google/GitHub matches exactly:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
3. No trailing slashes, must be HTTPS for Supabase URL

### Error: "Access Blocked: This app's request is invalid"
**Problem**: OAuth consent screen not configured

**Solution**:
1. Go to Google Cloud Console → APIs & Services → OAuth consent screen
2. Complete all required fields
3. Add your email as a test user if app is in testing mode

### OAuth button does nothing
**Problem**: Supabase credentials not saved or incorrect

**Solution**:
1. Check browser console for errors
2. Verify Client ID and Secret are correct in Supabase Dashboard
3. Make sure provider is **enabled** (toggle is ON)

### User redirected but not authenticated
**Problem**: Session not being set properly

**Solution**:
1. Check browser console for CORS errors
2. Verify `redirectTo` URL is correct (`${window.location.origin}/dashboard`)
3. Clear browser cache and cookies, try again

---

## Additional Providers (Future)

To add more providers (Discord, Facebook, Twitter):

1. Follow similar steps to create OAuth app in provider's console
2. Get Client ID and Secret
3. Enable in Supabase Dashboard → Auth → Providers
4. Add button to `src/pages/Auth.tsx`:
   ```tsx
   <Button onClick={() => handleOAuthSignIn('discord')}>
     <SiDiscord className="mr-2 h-5 w-5" />
     Discord
   </Button>
   ```

---

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth Setup Guide](https://support.google.com/cloud/answer/6158849)
- [GitHub OAuth Apps Docs](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
- [react-icons Documentation](https://react-icons.github.io/react-icons/)

---

## Status Tracking

### Google OAuth
- [ ] Created OAuth app in Google Cloud Console
- [ ] Configured OAuth consent screen
- [ ] Added callback URL to authorized redirect URIs
- [ ] Copied Client ID and Secret
- [ ] Added credentials to Supabase
- [ ] Tested locally
- [ ] Tested in production

### GitHub OAuth
- [ ] Created OAuth app in GitHub Settings
- [ ] Added callback URL
- [ ] Generated and copied Client Secret
- [ ] Added credentials to Supabase
- [ ] Tested locally
- [ ] Tested in production

---

**Questions or issues?** Check the troubleshooting section or reach out to the team.

✅ Once all checkboxes are complete, social login is ready to use!
