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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Environment Variables

Tạo file `.env.local` trong thư mục gốc và thêm các biến môi trường sau:

```env
# Google Maps API Key (cho tính năng autocomplete địa chỉ)
# Lấy API key tại: https://console.cloud.google.com/
# Cần bật Places API và Maps JavaScript API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Hướng dẫn lấy Google Maps API Key:

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Bật các API sau:
   - **Places API** (cho autocomplete địa chỉ)
   - **Maps JavaScript API** (cho Google Maps)
4. Vào **APIs & Services** > **Credentials**
5. Tạo **API Key** mới
6. (Tùy chọn) Giới hạn API key chỉ cho domain của bạn để bảo mật
7. Copy API key và thêm vào file `.env.local`

**Lưu ý:** Nếu không có API key, tính năng autocomplete địa chỉ sẽ không hoạt động, nhưng bạn vẫn có thể nhập địa chỉ và tọa độ thủ công.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


