# Deploy + Live Sync Setup

## 1) Configure Supabase
1. Create a Supabase project.
2. Open SQL editor and run `supabase.sql`.
3. In `Authentication > Users`, create one admin user (email/password) for writes.
4. Copy:
   - Project URL
   - `anon` public key

## 2) Configure Cloudinary
1. Create a Cloudinary account.
2. Create an unsigned upload preset (Settings > Upload > Upload presets).
3. Copy:
   - Cloud name
   - Upload preset name

## 3) Fill app config
Update `site-config.js`:

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://YOUR_PROJECT_ID.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY",
  CLOUDINARY_CLOUD_NAME: "YOUR_CLOUDINARY_CLOUD_NAME",
  CLOUDINARY_UPLOAD_PRESET: "YOUR_UNSIGNED_UPLOAD_PRESET",
  STORAGE_BUCKET: "portfolio-assets"
};
```

## 4) Deploy static site
Deploy the full folder to Netlify/Vercel/GitHub Pages.

## 5) How live updates work
- Admin saves -> writes to local cache + Supabase row `portfolio_content(key='primary')`.
- Portfolio page fetches from Supabase and polls every 15 seconds for updates.
- Asset uploads use Cloudinary URLs (fallback is base64 when Cloudinary is not configured).

## 6) Admin login behavior
- When Supabase is configured, admin login uses Supabase Auth (`signInWithPassword`).
- Use the same email/password you created in `Supabase > Authentication > Users`.
- If Supabase is not configured, it falls back to local in-browser credentials.

## Security note
- Current admin login in `admin.js` is client-side only.
- For real security, migrate admin auth to Supabase Auth and restrict writes to authenticated users only.
