import { createCookieSessionStorage, redirect } from '@remix-run/node'
import { UserModel } from '~/models/User.server'

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__session',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET!],
    secure: process.env.NODE_ENV === 'production'
  }
})

export async function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get('Cookie'))
}

export async function getUserId(request: Request) {
  const session = await getSession(request)
  return session.get('userId')
}

export async function getUser(request: Request) {
  const userId = await getUserId(request)
  if (!userId) return null
  
  return await UserModel.findById(userId)
}

export async function requireUser(request: Request) {
  const user = await getUser(request)
  if (!user) {
    throw redirect('/?signin=true')
  }
  return user
}

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await sessionStorage.getSession()
  session.set('userId', userId)
  
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session)
    }
  })
}

export async function logout(request: Request) {
  const session = await getSession(request)
  
  return redirect('/?signout=true', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session)
    }
  })
}