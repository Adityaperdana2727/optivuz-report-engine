# Optivuz Business — Accounting Report Engine (Vercel / Next.js)

Ini project **generator report akuntansi** yang menerima payload jurnal (2-line) dari Glide via webhook, lalu mengembalikan **URL report** untuk ditampilkan di WebView.

## Endpoint
- `POST /api/webhook?userId={USERID}`
  - Body: payload JSON (company, period, journals[])
  - Response: `{ ok: true, view_url: "/api/report?userId=..." }`

- `GET /api/report?userId={USERID}`
  - Mengembalikan HTML report (tabbed UI)

- `GET /api/health`
  - Status

## Cara jalanin lokal
```bash
npm install
npm run dev
```

Buka:
- http://localhost:3000  (landing)
- http://localhost:3000/api/health

## Deploy ke Vercel
- Push repo ke GitHub
- Import ke Vercel
- Build command: `npm run build`
- Output: default Next.js

## Catatan penting (storage)
Versi ini menggunakan **in-memory store** per `userId` (seperti pola XLSX generator kamu dulu).
Karena environment serverless bisa restart, report bisa hilang kalau instance mati.

Untuk production yang benar-benar robust, pindahkan `REPORT_STORE` ke:
- Vercel KV / Redis
- Supabase table
- S3 / R2 (HTML disimpan sebagai file)

Struktur kodenya sudah disiapkan agar migrasi storage mudah.
