# Email Notifications - Deployment Checklist

## ✅ Completed (Code)

- [x] Refactored Cloud Function to manual trigger approach
- [x] Created `SendReportModal` component
- [x] Added "Email report" button to App.tsx header (admin only)
- [x] Updated documentation (EMAIL_NOTIFICATIONS_SETUP.md)
- [x] Updated functions README.md
- [x] Removed old EmailNotifications component
- [x] Fixed TypeScript types in functions
- [x] Committed and pushed changes to GitHub
- [x] Created implementation summary document

## ⏳ Pending (Deployment & Testing)

### 1. SendGrid Setup (One-time)

- [ ] Create SendGrid account at cd "c:\Users\cmelk\Downloads\evidencia-revízií-náradia-a-spotrebičov"
firebase projects:list
- [ ] Verify sender email in SendGrid (Settings → Sender Authentication)
- [ ] Create API key in SendGrid (Settings → API Keys)
- [ ] Save API key somewhere safe (you'll only see it once!)

**Your SendGrid credentials**:

- API Key: `SG.___________________________` (fill in)
- Verified email: `________________@______` (fill in)

### 2. Firebase Functions Setup (One-time)

Open PowerShell and run these commands:

```powershell
# Navigate to functions directory
cd "c:\Users\cmelk\Downloads\evidencia-revízií-náradia-a-spotrebičov\functions"

# Install dependencies
npm install

# Configure SendGrid credentials (replace with your actual values)
firebase functions:config:set sendgrid.apikey="YOUR_SENDGRID_API_KEY_HERE" sendgrid.fromemail="your-verified-email@domain.com"

# Verify configuration
firebase functions:config:get

# Build TypeScript
npm run build

# Deploy function to Firebase
firebase deploy --only functions
```

**Expected results**:

- ✅ `npm install` completes without errors
- ✅ `firebase functions:config:set` confirms settings saved
- ✅ `firebase functions:config:get` shows your SendGrid config
- ✅ `npm run build` compiles TypeScript successfully
- ✅ `firebase deploy --only functions` deploys `sendInspectionReport` function

### 3. React App Deployment (Automatic)

The React app with the new button and modal will deploy automatically via GitHub Actions.

**Check deployment**:

- [ ] Go to https://github.com/idea3dsvk/revnote/actions
- [ ] Check that latest workflow run is green ✅
- [ ] Or wait a few minutes for it to complete

### 4. Testing Email Sending

#### Step 1: Access the App

- [ ] Go to https://idea3dsvk.github.io/revnote/
- [ ] Clear browser cache if needed (Ctrl+Shift+R)

#### Step 2: Login as Admin

- [ ] Click "Prihlásiť sa" button
- [ ] Use admin account credentials
- [ ] Verify you're logged in (see username in header)

#### Step 3: Test Email Button

- [ ] Look for blue "Email report" button in header (next to Dashboard button)
- [ ] If you don't see it, you're not logged in as admin

#### Step 4: Send Test Email

- [ ] Click "Email report" button
- [ ] Modal should open with email input
- [ ] Enter your email address (e.g., your Gmail)
- [ ] Click "Odoslať report" button
- [ ] Should see loading toast "Odosielam report..."
- [ ] Should see success toast with statistics after 2-5 seconds

#### Step 5: Check Email

- [ ] Check your email inbox (may take 1-2 minutes)
- [ ] Check spam folder if not in inbox
- [ ] Email subject should mention inspection status
- [ ] Email should have HTML formatting (colors, tables)
- [ ] Click "Otvoriť aplikáciu RevNote" button - should open app

#### Step 6: Verify Email Content

- [ ] Statistics summary shows at top (overdue/due soon/OK counts)
- [ ] Assets listed in three colored sections:
  - [ ] Red section: Assets past inspection date
  - [ ] Yellow section: Assets with inspection within 30 days
  - [ ] Green section: Assets in good standing
- [ ] Each asset shows: name, type, location, revision number, date
- [ ] Operator information displayed at bottom

### 5. Troubleshooting

If email doesn't send, check:

#### A. Firebase Function Logs

```powershell
firebase functions:log --only sendInspectionReport
```

Look for errors like:

- "SendGrid API key not configured" → Run step 2 again
- "Unauthenticated" → Login as admin
- "SendGrid error" → Check API key is correct

#### B. SendGrid Activity

- [ ] Go to https://app.sendgrid.com/email_activity
- [ ] Search for your recipient email
- [ ] Check status (Delivered, Bounced, etc.)
- [ ] If "Not Authorized" → Check sender email is verified

#### C. Browser Console

- [ ] Open DevTools (F12)
- [ ] Check Console tab for errors
- [ ] Look for function call errors

#### D. Firebase Console

- [ ] Go to https://console.firebase.google.com/project/revnote-89f0f/functions
- [ ] Check that `sendInspectionReport` function is deployed
- [ ] Check function logs for errors

### 6. Post-Testing Verification

- [ ] Test with different email addresses
- [ ] Test with empty assets list (all excluded)
- [ ] Test with mix of overdue/due soon/OK assets
- [ ] Verify modal closes after successful send
- [ ] Verify error handling (invalid email, no internet)
- [ ] Check SendGrid email count (should be under 100/day free tier)

## Common Issues & Solutions

### Issue: "Email report" button not visible

**Solution**: Login as admin user (only admins can send emails)

### Issue: "Cannot find module 'firebase-functions'"

**Solution**: Run `npm install` in functions directory

### Issue: "SendGrid API key not configured"

**Solution**:

```powershell
firebase functions:config:set sendgrid.apikey="YOUR_KEY" sendgrid.fromemail="YOUR_EMAIL"
firebase deploy --only functions
```

### Issue: Email goes to spam

**Solution**:

1. This is normal for SendGrid free tier
2. Add sender to contacts/safe senders
3. Or upgrade SendGrid plan for better deliverability

### Issue: "Sender not verified"

**Solution**:

1. Go to SendGrid → Settings → Sender Authentication
2. Verify your email address
3. Check verification email in your inbox
4. Update `sendgrid.fromemail` config with verified email

### Issue: TypeScript compile errors

**Solution**:

```powershell
cd functions
npm install
npm run build
```

## Success Criteria

✅ All these should be true:

- [ ] Function deployed successfully
- [ ] Admin can see and click "Email report" button
- [ ] Modal opens and accepts email input
- [ ] Email sends successfully (success toast appears)
- [ ] Email received in recipient inbox
- [ ] Email HTML renders correctly
- [ ] Email contains all expected information
- [ ] Statistics are accurate
- [ ] Links in email work

## Quick Reference

**Firebase Console**: https://console.firebase.google.com/project/revnote-89f0f
**SendGrid Dashboard**: https://app.sendgrid.com/
**App URL**: https://idea3dsvk.github.io/revnote/
**GitHub Actions**: https://github.com/idea3dsvk/revnote/actions

**Documentation**:

- Setup Guide: `EMAIL_NOTIFICATIONS_SETUP.md`
- Functions Docs: `functions/README.md`
- Implementation Summary: `EMAIL_IMPLEMENTATION_SUMMARY.md`
- This Checklist: `EMAIL_DEPLOYMENT_CHECKLIST.md`

## After Successful Testing

- [ ] Document team training needs
- [ ] Share SendGrid credentials with team lead (securely)
- [ ] Set up monitoring for SendGrid email quota
- [ ] Consider upgrading SendGrid if more than 100 emails/day needed
- [ ] Add email feature to user documentation

---

**Status**: Ready for deployment
**Next Step**: Complete "SendGrid Setup" section above
**Estimated Time**: 15-20 minutes for complete setup and testing
