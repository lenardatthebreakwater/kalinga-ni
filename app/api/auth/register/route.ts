import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationEmail } from '@/lib/notifications'

function generateToken() {
  return randomBytes(32).toString('hex')
}

function getVerificationUrl(token: string) {
  const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  return `${base}/verify?token=${token}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password, phone, role, gender, dateOfBirth } = body

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      // If they exist but are still PENDING, resend the verification email
      if (existingUser.status === 'PENDING') {
        // Delete old tokens for this user and issue a fresh one
        await prisma.emailVerificationToken.deleteMany({
          where: { userId: existingUser.id },
        })

        const token = generateToken()
        await prisma.emailVerificationToken.create({
          data: {
            userId: existingUser.id,
            token,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          },
        })

        await sendVerificationEmail({
          toEmail: existingUser.email,
          name: `${existingUser.firstName} ${existingUser.lastName}`,
          verificationUrl: getVerificationUrl(token),
        })

        return NextResponse.json(
          { message: 'Verification email resent. Please check your inbox.' },
          { status: 200 }
        )
      }

      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with PENDING status — requires email verification before login
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: role || 'PATIENT',
        status: 'PENDING',
      },
    })

    // Create patient profile if registering as patient
    if (!role || role === 'PATIENT') {
      await prisma.patient.create({
        data: {
          userId: user.id,
          gender: gender || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        },
      })
    }

    // Create staff profile if registering as staff
    if (role === 'STAFF') {
      await prisma.staff.create({
        data: {
          userId: user.id,
          specialization: 'General',
        },
      })
    }

    // Generate verification token (expires in 24 hours)
    const token = generateToken()
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    // Send verification email
    await sendVerificationEmail({
      toEmail: user.email,
      name: `${user.firstName} ${user.lastName}`,
      verificationUrl: getVerificationUrl(token),
    })

    return NextResponse.json(
      { message: 'Account created. Please check your email to verify your account.' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}