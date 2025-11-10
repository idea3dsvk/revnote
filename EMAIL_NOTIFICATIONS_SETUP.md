# Email Notifications - Setup Guide

## Overview

Email notification system allows admins to send comprehensive inspection reports via email on-demand. The system provides a manual trigger - an admin clicks the "Email report" button in the application header to send a report to any email address.

### Features

- ✅ **Manual trigger**: Admin clicks "Email report" button
- ✅ **Comprehensive report**: Includes all assets categorized by status
  - ⚠️ Po termíne (Overdue)
  - 📋 Do 30 dní (Due soon - within 30 days)
  - ✅ V poriadku (OK - over 30 days)
- ✅ **Professional HTML emails**: Responsive design with statistics
- ✅ **Plain text fallback**: For email clients that don't support HTML
- ✅ **Real-time data**: Always uses latest data from Firestore
- ✅ **Statistics included**: Shows count of overdue, due soon, and OK assets

### Benefits of Manual Trigger Approach

- ✅ **Stays on Firebase Spark (free) plan** - No need for Blaze upgrade
- ✅ **Simple setup** - No Cloud Scheduler configuration needed
- ✅ **Full control** - Admin decides when to send reports
- ✅ **Easier testing** - Test anytime with instant feedback
- ✅ **Cost effective** - No scheduled function execution costs
- ✅ **Admin only** - Feature restricted to users with admin permissions

---

## Setup Instructions

### 1. Firebase Project Configuration

**Good news**: Manual email sending works on the **free Firebase Spark plan**!

However, to deploy Cloud Functions, you need:

- Firebase CLI installed: `npm install -g firebase-tools`
- Logged in: `firebase login`

### 2. SendGrid Account Setup

1. **Create SendGrid account**:

   - Go to https://sendgrid.com/
   - Sign up for free account (100 emails/day free tier)

2. **Verify sender email**:

   - Go to Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Enter your email (e.g., revnote@yourdomain.com or your personal email)
   - Complete email verification process
   - This email will be used as "From" address

3. **Create API Key**:
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name: `RevNote Email Functions`
   - Permissions: Select "Mail Send" (Full Access also works)
   - Copy the API key immediately (you'll only see it once!)

### 3. Configure Firebase Functions

1. **Navigate to functions directory**:

   ```powershell
   cd c:\Users\cmelk\Downloads\evidencia-revízií-náradia-a-spotrebičov\functions
   ```

2. **Install dependencies**:

   ```powershell
   npm install
   ```

3. **Set Firebase config** (runtime configuration):

   ```powershell
   firebase functions:config:set sendgrid.apikey="YOUR_SENDGRID_API_KEY" sendgrid.fromemail="your-verified-email@domain.com"
   ```

   Replace:

   - `YOUR_SENDGRID_API_KEY`: The API key from SendGrid
   - `your-verified-email@domain.com`: The verified sender email from SendGrid

4. **Verify configuration**:

   ```powershell
   firebase functions:config:get
   ```

   Should show:

   ```json
   {
     "sendgrid": {
       "apikey": "SG.xxxxx",
       "fromemail": "your-email@domain.com"
     }
   }
   ```

### 4. Deploy Functions

1. **Build TypeScript**:

   ```powershell
   npm run build
   ```

2. **Deploy to Firebase**:

   ```powershell
   firebase deploy --only functions
   ```

3. **Verify deployment**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select project: `revnote-89f0f`
   - Navigate to Functions
   - You should see: `sendInspectionReport` (HTTP callable function)

### 5. Test Email Sending

1. **Login as admin**:

   - Go to https://idea3dsvk.github.io/revnote/
   - Click "Prihlásiť sa"
   - Use admin credentials

2. **Open email modal**:

   - Click the blue "Email report" button in header
   - Enter recipient email address
   - Click "Odoslať report"

3. **Check results**:

   - Should see success toast with statistics
   - Check recipient's inbox (may take 1-2 minutes)
   - Check SendGrid activity dashboard: https://app.sendgrid.com/email_activity

4. **Verify email content**:
   - ✅ Subject line shows status (overdue count if any)
   - ✅ Statistics summary at top
   - ✅ Assets categorized by status
   - ✅ Professional HTML formatting
   - ✅ "Otvoriť aplikáciu RevNote" button works

---

## Usage

### For Admin Users

1. **Login** to the application with admin account
2. **Click "Email report"** button in header (blue button with envelope icon)
3. **Enter recipient email** in modal
4. **Click "Odoslať report"** button
5. **Wait for confirmation** toast (shows statistics)
6. **Email delivered** to recipient inbox

### Email Report Contains

**Statistics Summary**:

- Total number of assets
- Count by category (overdue, due soon, OK)

**Categorized Asset Lists**:

1. **⚠️ Po termíne** (Overdue - red section)
   - Assets past inspection date
2. **📋 Do 30 dní** (Due soon - yellow section)
   - Assets with inspection within 30 days
3. **✅ V poriadku** (OK - green section)
   - Assets with inspection over 30 days away

**For Each Asset**:

- Name
- Type
- Location
- Revision number
- Next inspection date

**Operator Information** (if configured):

- Company name
- Address
- IČO
- Contact person

---

## Troubleshooting

### Function Deployment Issues

**Problem**: `Error: HTTP Error: 403, Permission denied`

```powershell
firebase login --reauth
```

**Problem**: TypeScript compilation errors

```powershell
cd functions
npm run build
```

Fix TypeScript errors before deploying.

**Problem**: `functions.config() is not available`

- Run: `firebase functions:config:set sendgrid.apikey="KEY" sendgrid.fromemail="EMAIL"`
- Redeploy: `firebase deploy --only functions`

### Email Not Sending

**Problem**: "SendGrid API key not configured"

- Check function logs: Firebase Console → Functions → sendInspectionReport → Logs
- Verify config: `firebase functions:config:get`
- Set config if missing (see step 3 above)

**Problem**: Email not received

1. **Check SendGrid activity**:

   - Go to https://app.sendgrid.com/email_activity
   - Search for recipient email
   - Check delivery status (Delivered, Bounced, etc.)

2. **Check spam folder**:

   - SendGrid free tier emails may go to spam
   - Add sender to contacts

3. **Verify sender email**:
   - Must be verified in SendGrid
   - Settings → Sender Authentication

### Function Errors

**Check logs**:

```powershell
firebase functions:log --only sendInspectionReport
```

**Common errors**:

- `Unauthenticated`: User not logged in
- `Internal`: SendGrid API error (check API key)
- `HTTP 403`: SendGrid sender not verified

### Testing Locally

**Start emulator**:

```powershell
cd functions
npm run serve
```

**Configure .env file** (for emulator):
Create `functions/.env`:

```
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=your-email@domain.com
```

**Test function**:

- Emulator runs at http://localhost:5001
- Use Firebase emulator UI to test

---

## Security Notes

### API Key Protection

- ✅ API key stored in Firebase config (not in code)
- ✅ Never commit API keys to git
- ✅ Function requires authentication (admin only in UI)

### Access Control

- ✅ Function checks `context.auth` (user must be logged in)
- ✅ UI button only shown to admin users
- ✅ Firebase security rules protect data

### Email Limits

- SendGrid free tier: **100 emails/day**
- Upgrade plan if more needed
- Monitor usage: SendGrid dashboard

---

## Cost Breakdown

### Firebase Spark (Free) Plan

- ✅ **HTTP callable functions**: Free (125K invocations/month)
- ✅ **Firestore reads**: Free (50K reads/day)
- ✅ **No Cloud Scheduler**: Not needed for manual trigger
- **Total Firebase cost**: $0/month

### SendGrid Free Tier

- ✅ **100 emails/day**: Free forever
- ✅ **Professional templates**: Included
- ✅ **Email activity dashboard**: Included
- **Total SendGrid cost**: $0/month (up to 100 emails/day)

### Upgrade Paths

**If you need more emails**:

- SendGrid Essentials: $19.95/month (50K emails)
- SendGrid Pro: $89.95/month (100K emails)

**If you need scheduled automation**:

- Firebase Blaze plan required for scheduled functions
- Cost: ~$0.01-0.05/month for daily scheduled function

---

## Next Steps

1. ✅ Complete setup steps above
2. ✅ Test email sending with your email
3. ✅ Add admin team emails to SendGrid verified senders
4. ✅ Train team on how to use the feature
5. ✅ Monitor SendGrid activity dashboard
6. 📊 Consider scheduled functions if automation needed (requires Blaze plan)

---

## Support

**Firebase Functions docs**: https://firebase.google.com/docs/functions
**SendGrid Node.js docs**: https://github.com/sendgrid/sendgrid-nodejs
**Firebase pricing**: https://firebase.google.com/pricing

For issues, check:

1. Firebase Console → Functions → Logs
2. SendGrid → Email Activity
3. Browser Console (DevTools)
