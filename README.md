# Pterodactyl Bot Hosting Platform

A full-stack Next.js 15 application that provides free Discord bot hosting through Pterodactyl panel integration.

## Features

- Discord OAuth2 authentication
- Automatic user and server provisioning on Pterodactyl
- Clean dashboard interface
- Free tier bot hosting (200MB RAM, 500MB storage)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env.local`:
   ```env
   DISCORD_CLIENT_ID=your-discord-client-id
   DISCORD_CLIENT_SECRET=your-discord-client-secret
   DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback
   PTERO_API_KEY=your-pterodactyl-application-api-key
   PTERO_PANEL_URL=https://your-panel-domain.com
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Discord OAuth Setup

1. Go to https://discord.com/developers/applications
2. Create a new application
3. Go to OAuth2 section
4. Add redirect URI: `http://localhost:3000/api/auth/discord/callback`
5. Copy Client ID and Client Secret to your `.env.local`

## Pterodactyl API Setup

1. Login to your Pterodactyl panel as admin
2. Go to Application API section
3. Create a new API key with full permissions
4. Copy the key to your `.env.local`

## Deployment

This app can be deployed to Vercel or any Node.js hosting platform. Make sure to update the `DISCORD_REDIRECT_URI` environment variable to match your production domain.

---

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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
