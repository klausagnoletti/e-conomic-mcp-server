# Developer Access & Tokens

This doc explains how developer access differs from end-user access in e-conomic, how to generate tokens, and common troubleshooting steps.

## Developer vs end-user access

- **Developer account**: owns the app definition and provides the **AppSecretToken** and **AppPublicToken**.
- **End-user account (agreement)**: grants access to a specific accounting agreement and produces the **AgreementGrantToken** when the app is installed.

The **AppSecretToken** is always taken from the developer app, not from the end-user agreement.

## Token types

- **AppSecretToken**
  - Issued in the developer app settings.
  - Used in API headers as `X-AppSecretToken`.

- **AppPublicToken**
  - Issued in the developer app settings.
  - Used only in the Installation URL to start the grant flow.
  - Never used in API headers.

- **AgreementGrantToken**
  - Issued when an end-user installs the app via the Installation URL.
  - Used in API headers as `X-AgreementGrantToken`.

## Creating tokens (recommended flow)

1) In your developer account, create the app and copy the **AppSecretToken**.
2) Copy the **Installation URL** for the same app.
3) Log into the end-user account that owns the agreement with accounting data.
4) Open the Installation URL in that session and approve access.
5) Copy the **AgreementGrantToken** shown after approval.

Use both tokens in every REST request:

```
X-AppSecretToken: <AppSecretToken>
X-AgreementGrantToken: <AgreementGrantToken>
```

## Environment setup

Create a `.env` in the repo root (never commit it) and add:

```
ECONOMIC_APP_SECRET_TOKEN=...
ECONOMIC_AGREEMENT_GRANT_TOKEN=...
ECONOMIC_BASE_URL=https://restapi.e-conomic.com
```

## FAQ

**Is there a separate secret token for the end-user account?**
No. The AppSecretToken always comes from the developer app. The end-user only provides the AgreementGrantToken.

**Can I use the AppPublicToken in API calls?**
No. It is only used in the Installation URL.

**Do I always need AgreementGrantToken?**
Yes for real data. The only exception is demo access, which uses `demo` for both tokens and supports GET only.

**Why does the app show as installed but API calls still fail?**
The most common cause is a mismatched token pair (AppSecretToken from one app + AgreementGrantToken from another app or agreement).

## Troubleshooting

### Error: E02250 (AppSecretToken does not correspond to the token)
This means the AppSecretToken and AgreementGrantToken are not a matching pair.

Checklist:
- Confirm the AgreementGrantToken was generated using the Installation URL for the same app that issued the AppSecretToken.
- If you reset the AppSecretToken, regenerate the AgreementGrantToken again for that app.
- Make sure you are logged into the correct end-user agreement when approving the app.
- Avoid copy/paste mistakes or trailing spaces in `.env`.

### Error: 401/403 with different message
These are typically permission or agreement access problems. Confirm the end-user account has access to the agreement and that the app has been approved for that agreement.

### Quick validation (direct request)
Use a direct request to isolate token issues from app code:

```
curl -s -i https://restapi.e-conomic.com/self \
  -H "X-AppSecretToken: YOUR_APP_SECRET" \
  -H "X-AgreementGrantToken: YOUR_AGREEMENT_GRANT" \
  -H "Content-Type: application/json"
```

## Demo access

If you want to test without real credentials:

```
ECONOMIC_APP_SECRET_TOKEN=demo
ECONOMIC_AGREEMENT_GRANT_TOKEN=demo
```

The demo API supports GET only and returns sample data.
