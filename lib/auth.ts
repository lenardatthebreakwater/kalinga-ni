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
        if (!credentials?.email || !credentials?.password) return null

        // Wait for DB to be ready (handles Turbopack cold start)
        try {
          await prisma.$connect()
        } catch {
          throw new Error('Database connection failed. Please try again.')
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
          // Image not returned here — fetched fresh in session callback
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }

      if (trigger === 'update' && session) {
        if (session.name) token.name = session.name
        // Bust the image cache so it re-fetches on next session read
        token.imageFetched = false
        token.cachedImage = undefined
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        const u = session.user as any
        u.role = token.role as string
        u.id = token.id as string

        // Cache the image in the token to avoid a DB hit on every session read
        if (token.imageFetched) {
          u.image = (token.cachedImage as string | null) ?? null
        } else {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { image: true },
          })
          u.image = dbUser?.image ?? null
          token.cachedImage = u.image
          token.imageFetched = true
        }
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