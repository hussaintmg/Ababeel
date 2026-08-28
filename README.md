This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

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

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Publishing site content

The homepage content lives in MongoDB, not in the code, so it can be edited in
Owner → Website CMS. To (re)publish it from the seed scripts on a server:

```bash
npm run cms:animation   # builds the scroll-driven frame sequence
npm run cms:home        # publishes the homepage blocks
```

Both read `MONGO_URI` from `.env`, print which database they are about to write
to, and refuse to run against one that does not look like this application's.

## A note on package-lock.json

Native packages (`lightningcss`, `@tailwindcss/oxide`) ship one prebuilt binary
per platform, and the lockfile has to list all of them. npm on Windows can
write a lockfile holding only the `win32` entries; a Linux server then installs
no binary at all and the build fails with:

```
Cannot find module '../lightningcss.linux-x64-gnu.node'
```

If that happens, check the lockfile still contains `lightningcss-linux-x64-gnu`
and `@tailwindcss/oxide-linux-x64-gnu` before committing it.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
