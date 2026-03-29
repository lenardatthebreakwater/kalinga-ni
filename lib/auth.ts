import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from './db'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user) return null
        if (user.status && user.status !== 'ACTIVE') {
          throw new Error(
            user.status === 'SUSPENDED'
            ? 'Your account has been suspended. Please contact the clinic.'
            : user.status === 'BANNED'
            ? 'Your account has been banned. Please contact the clinic.'
            : 'This account no longer exists.'
          )
        }
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        if (!isPasswordValid) return null
        
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as any
        const role = token.role as string
        const id = token.id as string
        u.role = role
        u.id = id
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})