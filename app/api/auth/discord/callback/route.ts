import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url))
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI!,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    const { access_token } = tokenResponse.data

    // Fetch user info
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    const user = {
      id: userResponse.data.id,
      username: userResponse.data.username,
      email: userResponse.data.email,
      avatar: userResponse.data.avatar,
    }

    // Create a response and set cookie
    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    response.cookies.set('discord_user', JSON.stringify(user), {
      httpOnly: true,
      maxAge: 86400,
      path: '/',
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    console.error('Discord OAuth error:', error)
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }
}
