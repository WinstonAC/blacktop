# Fall Blacktop Camp — Apps Script deployment

Spreadsheet: [Blacktop Fall Camp Registrations](https://docs.google.com/spreadsheets/d/1pc623ubSs91skx2QYIeaJfcfGo-o9uINZ6Kj9i8A74c/edit)

Web app URL (set in `index.html` as `SHEET_ENDPOINT`):

`https://script.google.com/macros/s/AKfycbxdyq2vWKU2fLr60P1tneBe4P1u4WA2bej41R8qnLH2Bl02Fg1T4iPEMsCDkWNiYHuM/exec`

## Install script (copy entire file)

Use either:
- **Spreadsheet-bound:** camp spreadsheet → **Extensions** → **Apps Script**, or
- **Standalone project** (what you have now is fine) — the script knows the sheet id `1pc623ubSs91skx2QYIeaJfcfGo-o9uINZ6Kj9i8A74c`.

1. Open your Apps Script project for Fall Camp.
2. Select all code in the editor and delete it.
3. Paste the **entire** contents of [`apps-script/CampConfirmation.gs`](apps-script/CampConfirmation.gs).
4. At the **top** of the file, change this line to **your** Google account (same as top-right in Apps Script):

   ```javascript
   var CAMP_DEPLOYING_GOOGLE_ACCOUNT = 'you@gmail.com';
   ```

5. **Save**.

## One-time setup in the editor

1. In the function dropdown, choose **`runCampSetupOnce`** (not `configureRegistrationSheet` alone) → **Run** → authorize when prompted.
2. **Deploy** → **Manage deployments** → edit web app → **New version**:
   - **Execute as:** Me  
   - **Who has access:** Anyone  
3. **Deploy**. Update `SHEET_ENDPOINT` in `index.html` if the URL changed.

## Verify

- Open the `/exec` URL in a browser. You should see JSON like `{"success":false}` (not a login page or 403).
- Submit a test registration. Expect a new sheet row, email to `robertjanice@bellsouth.net`, and a thank-you to the guardian.

## Emails

| Message | To | From (what parents see) |
|--------|-----|-------------------------|
| Registration details | `robertjanice@bellsouth.net` | Script owner Gmail (display name: Coach Mitchell) |
| Thank-you | Guardian email on form | Ideally **robertjanice@bellsouth.net** (see below) |

### Show thank-you as `robertjanice@bellsouth.net` (not personal Gmail)

Apps Script can only send **from** addresses your Google account is allowed to use.

1. In **Gmail** (logged in as the same account that deploys the script), open **Settings** → **Accounts and import**.
2. Under **Send mail as**, add **`robertjanice@bellsouth.net`** and complete verification (BellSouth/AT&T may require an app password or forwarding setup).
3. After it shows as verified, thank-you emails use `GmailApp` with `from: robertjanice@bellsouth.net` and display name **Coach Mitchell — Blacktop Basketball Fall Camp**.
4. **Reply** always goes to `robertjanice@bellsouth.net` via `replyTo`.

If BellSouth send-as is not verified, thank-you still sends but may show your personal Gmail until step 2 is done.

### “Coach Mitchell” without a separate alias address

You do **not** need a second email inbox for camp. The script already sets the **display name** to `Coach Mitchell — Blacktop Basketball Fall Camp`. Parents see that name; **Reply** goes to `robertjanice@bellsouth.net`. Optional: when adding **Send mail as** for BellSouth, set the same display name in Gmail for that alias.

There is no Apps-Script-only alias—only Gmail **Send mail as** on the Google account that deploys the script.

## CORS / form errors

If the browser shows a CORS error or “We couldn’t confirm your registration”, the web app is usually not deployed as **Anyone** or the script was not saved/redeployed. Fix deployment first, then test `/exec` in a new tab.