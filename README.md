# Blacktop Basketball Camp - Registration Page

A mobile-friendly web form for parents to register their children for the basketball camp. Features a complete online registration form with automatic email functionality.

## Project Structure

```
blacktop-download/
  |-- index.html          # Main registration form page
  |-- public/             # Static assets folder
  |-- README.md           # This file
  |-- vercel.json         # Vercel deployment configuration
```

## Features

- 📝 Fall Camp online registration form
- 📱 Mobile-first responsive design
- ✉️ Submits to Google Apps Script (sheet + automatic emails)
- 🎯 Validation, permission checkboxes, minimum age 3
- 🏀 Fall Blacktop Camp branding
- 📧 Organizer: robertjanice@bellsouth.net; guardian thank-you email
- 🚀 Static deploy on Vercel (see `vercel.json`)

See [APPS_SCRIPT_DEPLOYMENT.md](APPS_SCRIPT_DEPLOYMENT.md) for Google Sheet + Apps Script setup.

## Quick Deploy to Vercel

### Option 1: Drag & Drop (Easiest)
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Drag your `blacktop-download` folder to the upload area
4. Vercel will auto-detect it's a static site
5. Click "Deploy" - you'll get a URL like `blacktop-camp.vercel.app`

### Option 2: GitHub Integration
1. Push this folder to a GitHub repository
2. Connect your GitHub account to Vercel
3. Import the repository
4. Deploy automatically

## Form Sections

The registration form includes:
- **Player Information**: Name, age, date of birth, t-shirt size
- **Parent/Guardian Information**: Contact details and address
- **Payment Information**: Payment date, amount, and payment methods
- **Permissions**: Liability release and photo permission
- **Signature**: Electronic signature with date

## Customization

### Content
- Update the email address in the form submission
- Modify form fields as needed
- Change the basketball emoji to match your branding

## Important Notes

1. **Form Validation**: All required fields are validated before submission
2. **Email Integration**: Form data is automatically formatted and opens in user's email client
3. **Mobile Optimized**: Designed mobile-first for easy use on phones and tablets
4. **QR Code**: Point your Canva QR code to the deployed Vercel URL
5. **Domain**: You can add a custom domain later in Vercel settings

## Support

The page includes a footer with contact information for parents who need help. All styling is inline CSS for maximum compatibility across devices and browsers.
