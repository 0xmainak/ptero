import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie')
  
  if (!cookieHeader) {
    return new Response('Unauthorized', { status: 401 })
  }

  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map(cookie => {
      const [name, value] = cookie.split('=')
      return [name, decodeURIComponent(value)]
    })
  )

  const userCookie = cookies.discord_user

  if (!userCookie) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const user = JSON.parse(userCookie)
    return Response.json(user)
  } catch (error) {
    return new Response('Invalid user data', { status: 400 })
  }
}
