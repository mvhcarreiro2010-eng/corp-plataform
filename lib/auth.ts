import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/entrar',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordMatch) return null

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date(), lastSeenAt: new Date() },
        })

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar ?? undefined,
          jobTitle: user.jobTitle ?? undefined,
          department: user.department ?? undefined,
          xp: user.xp,
          level: user.level,
          buId: user.buId ?? undefined,
          mustChangePassword: user.mustChangePassword,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.avatar = (user as any).avatar
        token.jobTitle = (user as any).jobTitle
        token.department = (user as any).department
        token.xp = (user as any).xp
        token.level = (user as any).level
        token.buId = (user as any).buId
        token.mustChangePassword = (user as any).mustChangePassword
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.avatar = token.avatar as string | undefined
        session.user.jobTitle = token.jobTitle as string | undefined
        session.user.department = token.department as string | undefined
        session.user.xp = token.xp as number
        session.user.level = token.level as number
        session.user.buId = token.buId as string | undefined
        session.user.mustChangePassword = token.mustChangePassword as boolean | undefined
      }
      return session
    },
  },
})
