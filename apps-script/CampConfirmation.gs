// Fall Blacktop Camp Apps Script.
// Paste into the camp project (from the spreadsheet OR standalone — both work).
// Then run runCampSetupOnce() once, redeploy web app (Anyone).

var ORGANIZER_EMAIL = 'robertjanice@bellsouth.net';
var COACH_FROM_NAME = 'Coach Mitchell — Blacktop Basketball Fall Camp';
var FALL_CAMP_SPREADSHEET_ID = '1pc623ubSs91skx2QYIeaJfcfGo-o9uINZ6Kj9i8A74c';

// Optional override. If left as placeholder, runCampSetupOnce() uses the account in the top-right of Apps Script.
var CAMP_DEPLOYING_GOOGLE_ACCOUNT = 'wcampbell0880@gmail.com';

function configureRegistrationSheet() {
  const bound = SpreadsheetApp.getActiveSpreadsheet();
  const sheetId = bound ? bound.getId() : FALL_CAMP_SPREADSHEET_ID;
  PropertiesService.getScriptProperties().setProperty('BLACKTOP_CAMP_SHEET_ID', sheetId);
}

function configureBlacktopSender(senderEmail) {
  const email = String(senderEmail || '').trim();
  if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email)) {
    throw new Error('Pass a valid sender email, e.g. configureBlacktopSender("you@gmail.com")');
  }
  PropertiesService.getScriptProperties().setProperty('BLACKTOP_CAMP_SENDER_EMAIL', email);
}

/** Run once from the editor: links sheet + saves deploying Google account. */
function runCampSetupOnce() {
  var sender = String(CAMP_DEPLOYING_GOOGLE_ACCOUNT || '').trim();
  if (sender.indexOf('YOUR_GOOGLE_ACCOUNT') >= 0) {
    sender = Session.getActiveUser().getEmail();
  }
  if (!sender || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(sender)) {
    throw new Error('Could not detect your Google account. Set CAMP_DEPLOYING_GOOGLE_ACCOUNT at the top of this file.');
  }
  configureRegistrationSheet();
  configureBlacktopSender(sender);
  Logger.log('Fall Camp setup complete. Sender: ' + sender + '. Redeploy web app (Anyone) next.');
}

function getRegistrationSheet() {
  const sheetId = PropertiesService.getScriptProperties().getProperty('BLACKTOP_CAMP_SHEET_ID');
  if (!sheetId) {
    throw new Error('Run runCampSetupOnce() once in the editor, then redeploy the web app.');
  }
  const spreadsheet = SpreadsheetApp.openById(sheetId);
  let sheet = spreadsheet.getSheets().find(function (tab) { return tab.getSheetId() === 0; });
  if (!sheet) {
    sheet = spreadsheet.getSheetByName('Form Responses 1');
  }
  if (!sheet) {
    throw new Error('Registration tab not found.');
  }
  return sheet;
}

function doGet(e) {
  return handleSubmission(e);
}

function doPost(e) {
  return handleSubmission(e);
}

function registrationReceipt(success, emailsSent, retryEmails) {
  return ContentService.createTextOutput(JSON.stringify({
    success: success === true,
    emailsSent: emailsSent === true,
    retryEmails: retryEmails === true
  })).setMimeType(ContentService.MimeType.JSON);
}

function campSubmissionValid(data) {
  if (!data.playerFirstName || !data.playerLastName) return false;
  if (!data.parentFirstName || !data.parentLastName) return false;
  if (!data.parentGuardianName || !data.signatureDate) return false;
  if (data.liabilityRelease !== 'Yes' || data.photoPermission !== 'Yes') return false;
  if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(String(data.guardianEmail || ''))) return false;
  var onsite = data.cashPaidOnsite === 'Yes';
  var cashapp = data.cashapp === 'Yes';
  if (onsite === cashapp) return false;
  return true;
}

function sanitizeCampCell_(value) {
  return typeof value === 'string' && /^[=+@-]/.test(value) ? "'" + value : (value || '');
}

function campFieldMap_(data, id) {
  return {
    'Timestamp': new Date(),
    'Player First Name': data.playerFirstName,
    'Player Last Name': data.playerLastName,
    'Date of Birth': data.dateOfBirth || '',
    'Age': data.age || '',
    'T-Shirt Size': data.tshirtSize || '',
    'Parent First Name': data.parentFirstName,
    'Parent Last Name': data.parentLastName,
    'Address': data.address || '',
    'City': data.city || '',
    'State': data.state || '',
    'Zip': data.zip || '',
    'Cell Number': data.cellNumber || '',
    'Alt Phone': data.altPhone || '',
    'Guardian Email': data.guardianEmail || '',
    'Paid Date': data.paidDate || '',
    'Amount Paid': data.amountPaid || '',
    'Cash Paid Onsite': data.cashPaidOnsite || 'No',
    'CashApp': data.cashapp || 'No',
    'Liability Release': data.liabilityRelease || 'No',
    'Photo Permission': data.photoPermission || 'No',
    'Parent/Guardian Signature Name': data.parentGuardianName || '',
    'Signature Date': data.signatureDate || '',
    'Blacktop registration ID': id || ''
  };
}

function headerColumnIndex_(headers, name) {
  var i = headers.indexOf(name);
  return i >= 0 ? i + 1 : 0;
}

function buildCampRowFromHeaders_(sheet, data, id) {
  var width = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, width).getValues()[0];
  var map = campFieldMap_(data, id);
  return headers.map(function (h) {
    var key = String(h || '').trim();
    if (map[key] !== undefined) return sanitizeCampCell_(map[key]);
    return '';
  });
}

function handleSubmission(e) {
  const data = (e && e.parameter) || {};
  if (!campSubmissionValid(data)) {
    return registrationReceipt(false);
  }

  const id = data.registrationId || Utilities.getUuid();
  if (!/^[a-f0-9-]{36}$/i.test(id)) return registrationReceipt(false);

  const lock = LockService.getScriptLock();
  let saved = false;
  try {
    lock.waitLock(10000);
    const sheet = getRegistrationSheet();
    const width = Math.max(23, sheet.getLastColumn());
    const headers = sheet.getRange(1, 1, 1, width).getValues()[0];

    let idColumn = headers.indexOf('Blacktop registration ID') + 1;
    if (!idColumn) {
      idColumn = width + 1;
      if (idColumn > sheet.getMaxColumns()) sheet.insertColumnAfter(width);
      sheet.getRange(1, idColumn).setValue('Blacktop registration ID');
    }

    const deliveryColumns = ['Blacktop organizer email', 'Blacktop guardian email'].map(function (label) {
      const existing = headers.indexOf(label);
      if (existing >= 0) return existing + 1;
      const column = sheet.getLastColumn() + 1;
      if (column > sheet.getMaxColumns()) sheet.insertColumnAfter(column - 1);
      sheet.getRange(1, column).setValue(label);
      return column;
    });

    const count = sheet.getLastRow() - 1;
    const previous = count > 0 && sheet.getRange(2, idColumn, count, 1)
      .createTextFinder(id).matchEntireCell(true).findNext();

    let rowNumber;
    if (previous) {
      rowNumber = previous.getRow();
      var firstCol = headerColumnIndex_(headers, 'Player First Name');
      var lastCol = headerColumnIndex_(headers, 'Player Last Name');
      var emailCol = headerColumnIndex_(headers, 'Guardian Email');
      if (!firstCol || !lastCol || !emailCol) return registrationReceipt(false);
      if (sheet.getRange(rowNumber, firstCol).getDisplayValue() !== data.playerFirstName ||
          sheet.getRange(rowNumber, lastCol).getDisplayValue() !== data.playerLastName ||
          sheet.getRange(rowNumber, emailCol).getDisplayValue() !== data.guardianEmail) {
        return registrationReceipt(false);
      }
    } else {
      var row = buildCampRowFromHeaders_(sheet, data, id);
      if (idColumn > row.length) {
        while (row.length < idColumn) row.push('');
      }
      row[idColumn - 1] = id;
      sheet.appendRow(row);
      rowNumber = sheet.getLastRow();
      deliveryColumns.forEach(function (column) {
        sheet.getRange(rowNumber, column).setValue('pending');
      });
      SpreadsheetApp.flush();
    }

    saved = true;
    const sendOrganizer = function () {
      MailApp.sendEmail({
        to: ORGANIZER_EMAIL,
        replyTo: ORGANIZER_EMAIL,
        name: COACH_FROM_NAME,
        subject: 'Blacktop Basketball Fall Camp Registration - ' + data.playerFirstName + ' ' + data.playerLastName,
        body: campRegistrationEmailBody(data)
      });
    };
    const sendGuardian = function () {
      sendFallCampThankYou(data);
    };

    const statuses = deliveryColumns.map(function (column, i) {
      const cell = sheet.getRange(rowNumber, column);
      const status = cell.getValue();
      if (status !== 'pending') return status;
      try {
        if (i === 0) sendOrganizer();
        else sendGuardian();
      } catch (error) {
        console.error('Camp email send failed for ' + id + ', recipient ' + i + ': ' + error);
        return 'pending';
      }
      cell.setValue('sent');
      SpreadsheetApp.flush();
      return 'sent';
    });

    return registrationReceipt(true, statuses.every(function (s) { return s === 'sent'; }), statuses.indexOf('pending') >= 0);
  } catch (error) {
    console.error('Camp registration processing failed', error);
    return registrationReceipt(saved);
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function formatCampDate(value) {
  if (!value) return '';
  const parts = String(value).split('-');
  if (parts.length !== 3) return value;
  return parts[1] + '/' + parts[2] + '/' + parts[0];
}

function campRegistrationEmailBody(data) {
  return 'BLACKTOP BASKETBALL FALL CAMP REGISTRATION\n' +
    '==========================================\n\n' +
    'PLAYER INFORMATION\n' +
    '------------------------------------------\n' +
    'Player First Name: ' + (data.playerFirstName || '') + '\n' +
    'Player Last Name: ' + (data.playerLastName || '') + '\n' +
    'Age: ' + (data.age || '') + '\n' +
    'Date of Birth: ' + formatCampDate(data.dateOfBirth) + '\n' +
    'T-Shirt Size: ' + (data.tshirtSize || '') + '\n\n' +
    'PARENT/GUARDIAN INFORMATION\n' +
    '------------------------------------------\n' +
    'Parent First Name: ' + (data.parentFirstName || '') + '\n' +
    'Parent Last Name: ' + (data.parentLastName || '') + '\n' +
    'Address: ' + (data.address || '') + '\n' +
    'City: ' + (data.city || '') + '\n' +
    'State: ' + (data.state || '') + '\n' +
    'Zip: ' + (data.zip || '') + '\n' +
    'Cell Number: ' + (data.cellNumber || '') + '\n' +
    'Alt Phone: ' + (data.altPhone || 'N/A') + '\n' +
    'Guardian Email: ' + (data.guardianEmail || '') + '\n\n' +
    'PAYMENT INFORMATION\n' +
    '------------------------------------------\n' +
    'Paid Date: ' + formatCampDate(data.paidDate) + '\n' +
    'Amount Paid: $' + (data.amountPaid || '') + '\n' +
    'Cash Paid onsite: ' + (data.cashPaidOnsite || 'No') + '\n' +
    'CashApp: ' + (data.cashapp || 'No') + '\n\n' +
    'PERMISSIONS\n' +
    '------------------------------------------\n' +
    'Liability Release: ' + (data.liabilityRelease || 'NO') + '\n' +
    'Photo Permission: ' + (data.photoPermission || 'NO') + '\n\n' +
    'SIGNATURE\n' +
    '------------------------------------------\n' +
    'Parent/Guardian Name: ' + (data.parentGuardianName || '') + '\n' +
    'Date: ' + formatCampDate(data.signatureDate) + '\n\n' +
    '==========================================\n';
}

/**
 * Sends parent thank-you. Tries to show FROM as robertjanice@bellsouth.net when that address
 * is set up under Gmail → Settings → Accounts → "Send mail as" for the deploying Google account.
 */
function sendFallCampThankYou(registration) {
  const configuredSender = PropertiesService.getScriptProperties()
    .getProperty('BLACKTOP_CAMP_SENDER_EMAIL');
  const sender = Session.getEffectiveUser().getEmail();
  if (!configuredSender || sender.toLowerCase() !== configuredSender.trim().toLowerCase()) {
    throw new Error('Run runCampSetupOnce() with your Google account, then redeploy the web app.');
  }

  const recipient = String(registration.guardianEmail || '').trim();
  if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(recipient)) {
    throw new Error('Guardian email required.');
  }

  const subject = 'Thank you for registering for Blacktop Basketball Fall Camp';
  const body = 'Thank you for signing up for Blacktop Basketball Fall Camp! We received your registration. ' +
    'If you have any questions before camp, reply to this email.\n\n' +
    'See you on the court!\nCoach Mitchell\nBlacktop Basketball Fall Camp';

  sendCoachBrandedEmail_(recipient, subject, body);
}

function sendCoachBrandedEmail_(recipient, subject, body) {
  try {
    GmailApp.sendEmail(recipient, subject, body, {
      from: ORGANIZER_EMAIL,
      name: COACH_FROM_NAME,
      replyTo: ORGANIZER_EMAIL
    });
    return;
  } catch (gmailErr) {
    console.warn('Gmail send-as ' + ORGANIZER_EMAIL + ' failed (add Send mail as in Gmail?): ' + gmailErr);
  }

  MailApp.sendEmail({
    to: recipient,
    name: COACH_FROM_NAME,
    replyTo: ORGANIZER_EMAIL,
    subject: subject,
    body: body
  });
}