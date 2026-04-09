import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/user/profile
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id as string

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        createdAt: true,
        patient: {
          select: {
            dateOfBirth: true,
            gender: true,
            bloodType: true,
            allergies: true,
            emergencyContact: true,
            emergencyPhone: true,
          },
        },
        staff: {
          select: {
            specialization: true,
            licenseNumber: true,
            department: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// PATCH /api/user/profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id as string
    const role = (session.user as any).role as string
    const body = await request.json()

    const {
      firstName,
      lastName,
      phone,
      image,
      // Patient-specific
      dateOfBirth,
      gender,
      bloodType,
      allergies,
      emergencyContact,
      emergencyPhone,
      // Staff-specific
      specialization,
      licenseNumber,
      department,
    } = body

    // Validate image size if provided (base64 max ~2MB)
    if (image && image.length > 2 * 1024 * 1024 * 1.37) {
      return NextResponse.json(
        { error: 'Profile picture is too large. Please use an image under 2MB.' },
        { status: 400 }
      )
    }

    // Update base user fields
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName: firstName.trim() }),
        ...(lastName && { lastName: lastName.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(image !== undefined && { image }),
      },
    })

    // Update role-specific profile
    if (role === 'PATIENT') {
      await prisma.patient.update({
        where: { userId },
        data: {
          ...(dateOfBirth !== undefined && {
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          }),
          ...(gender !== undefined && { gender: gender || null }),
          ...(bloodType !== undefined && { bloodType: bloodType || null }),
          ...(allergies !== undefined && { allergies: allergies?.trim() || null }),
          ...(emergencyContact !== undefined && {
            emergencyContact: emergencyContact?.trim() || null,
          }),
          ...(emergencyPhone !== undefined && {
            emergencyPhone: emergencyPhone?.trim() || null,
          }),
        },
      })
    }

    if (role === 'STAFF') {
      await prisma.staff.update({
        where: { userId },
        data: {
          ...(specialization && { specialization: specialization.trim() }),
          ...(licenseNumber !== undefined && {
            licenseNumber: licenseNumber?.trim() || null,
          }),
          ...(department !== undefined && { department: department?.trim() || null }),
        },
      })
    }

    return NextResponse.json({ success: true, name: `${updatedUser.firstName} ${updatedUser.lastName}` })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}