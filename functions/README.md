# Firebase Cloud Functions - RevNote Email Notifications

## Overview

This directory contains Firebase Cloud Functions for sending email reports about equipment inspection status. The function is triggered manually by admin users from the application.

## Functions

### `sendInspectionReport` (HTTP Callable)

**Trigger**: Manual (called from admin UI button)
**Purpose**: Sends comprehensive email report with all assets categorized by inspection status

**Input**:

```typescript
{
  recipientEmail: string; // Email address to send report to
}
```

**Output**:

```typescript
{
  success: boolean,
  message: string,  // Slovak success message
  stats: {
    overdue: number,    // Count of assets past inspection date
    dueSoon: number,    // Count of assets with inspection within 30 days
    ok: number          // Count of assets in good standing
  }
}
```

**Report Categories**:

1. **⚠️ Po termíne** - Assets past inspection date
2. **📋 Do 30 dní** - Assets with inspection within 30 days
3. **✅ V poriadku** - Assets with inspection over 30 days away

**Security**: Requires authenticated user (checks `context.auth`)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure SendGrid

Set Firebase config with SendGrid credentials:

```bash
firebase functions:config:set sendgrid.apikey="YOUR_API_KEY" sendgrid.fromemail="your-verified-email@domain.com"
```

### 3. Build TypeScript

```bash
npm run build
```

### 4. Deploy Functions

```bash
firebase deploy --only functions
```

## Email Templates

### HTML Email

- Responsive design
- Color-coded sections (red/yellow/green)
- Statistics summary at top
- Asset table with all details
- Operator information
- Link to open application

### Plain Text Email

- Clean text formatting
- Same information as HTML
- Compatible with all email clients

## Development

### Local Testing

```bash
npm run serve
```

Create `functions/.env` for local testing:

```
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=your-email@domain.com
```

### TypeScript Compilation

```bash
npm run build
```

### Logs

View function logs:

```bash
firebase functions:log --only sendInspectionReport
```

## Dependencies

- `firebase-functions`: ^4.6.0 - Cloud Functions framework
- `firebase-admin`: ^12.0.0 - Firebase Admin SDK
- `@sendgrid/mail`: ^7.7.0 - SendGrid email service

## Architecture

```
Client (Admin UI Button)
  ↓ (HTTPS callable function)
Firebase Cloud Function (sendInspectionReport)
  ↓ (queries)
Firestore (assets, operator collections)
  ↓ (categorizes & formats)
Email Templates (HTML + Text)
  ↓ (sends via)
SendGrid API
  ↓ (delivers to)
Recipient Email
```

## Cost

**Firebase Spark (Free) Plan**:

- ✅ 125K HTTP callable invocations/month
- ✅ 50K Firestore reads/day
- ✅ No Cloud Scheduler needed

**SendGrid Free Tier**:

- ✅ 100 emails/day

**Total**: $0/month (within free tier limits)

## Security

- Function requires authentication
- SendGrid API key stored in Firebase config (not in code)
- Only active (non-excluded) assets included in report
- Admin-only access enforced in UI

## Error Handling

The function handles:

- Unauthenticated requests → `HttpsError('unauthenticated')`
- SendGrid errors → `HttpsError('internal')`
- Missing configuration → Logs error, returns gracefully

## File Structure

```
functions/
├── src/
│   └── index.ts           # Main function code
├── package.json           # Dependencies
├── tsconfig.json         # TypeScript config
├── .gitignore            # Excludes node_modules, .env, etc.
└── README.md             # This file
```

## Next Steps

1. Complete setup in EMAIL_NOTIFICATIONS_SETUP.md
2. Test email sending from admin account
3. Monitor SendGrid activity dashboard
4. Check Firebase function logs for errors

## Support

- **Firebase Functions**: https://firebase.google.com/docs/functions
- **SendGrid Node.js**: https://github.com/sendgrid/sendgrid-nodejs
- **TypeScript**: https://www.typescriptlang.org/docs/
