import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/auth/verify?token=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { message: 'Missing verification token' },
        { status: 400 }
      )
    }

    // Look up the token
    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!record) {
      return NextResponse.json(
        { message: 'Invalid or already used verification link.' },
        { status: 400 }
      )
    }

    if (record.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.emailVerificationToken.delete({ where: { token } })
      return NextResponse.json(
        { message: 'This verification link has expired. Please register again to get a new one.' },
        { status: 400 }
      )
    }

    if (record.user.status === 'ACTIVE') {
      // Already verified — just clean up the token and let them know
      await prisma.emailVerificationToken.delete({ where: { token } })
      return NextResponse.json(
        { message: 'Your account is already verified. You can log in.' },
        { status: 200 }
      )
    }

    // Activate the user and delete the token in one transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { status: 'ACTIVE' },
      }),
      prisma.emailVerificationToken.delete({
        where: { token },
      }),
    ])

    return NextResponse.json(
      { message: 'Email verified successfully! You can now log in.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}