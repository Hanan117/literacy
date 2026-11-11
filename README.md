This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase lokal

Autentikasi memakai Supabase yang berjalan di Docker. Port default Supabase
(`54321`–`54324`) berada di dalam range port yang dipesan otomatis oleh
Windows/Hyper-V, sehingga Docker gagal bind dengan error
`socket ... forbidden`. Karena itu port dipindah ke bawah `49152`:

| Service | Alamat |
| --- | --- |
| API / Auth | `http://127.0.0.1:44321` |
| Database | `postgresql://postgres:postgres@127.0.0.1:44322/postgres` |
| Studio | `http://127.0.0.1:44323` (opsional) |
| Mailpit | `http://127.0.0.1:44324` |

Perintah yang dipakai:

```bash
bun run supabase:start   # start tanpa studio/imgproxy/edge-runtime/supavisor/logflare
bun run supabase:status
bun run supabase:stop    # data tetap tersimpan
```

`studio`, `imgproxy`, `edge-runtime`, `supavisor`, dan `logflare` sengaja
dikecualikan agar `start` tidak menunggu pull image besar. Kalau butuh Studio,
unduh image-nya lebih dulu, lalu jalankan
`bunx supabase start -x imgproxy,edge-runtime,supavisor,logflare`.

Sesuaikan `.env` dengan port di atas (`NEXT_PUBLIC_SUPABASE_URL` dan
`DATABASE_URL`).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
