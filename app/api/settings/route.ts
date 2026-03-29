import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    let settings = await prisma.clinicSettings.findFirst()

    if (!settings) {
      settings = await prisma.clinicSettings.create({
        data: {
          clinicName: 'Kalinga-ni Clinic',
          clinicEmail: 'contact@kalinga-ni.com',
          clinicPhone: '+63-2-1234-5678',
          clinicAddress: '123 Healthcare Street',
          clinicCity: 'Quezon City',
          clinicZipCode: '1100',
          operatingHours: '9:00 AM - 6:00 PM, Monday to Friday',
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const settings = await prisma.clinicSettings.findFirst()

    if (!settings) {
      return NextResponse.json(
        { message: 'Settings not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.clinicSettings.update({
      where: { id: settings.id },
      data: {
        clinicName: body.clinicName,
        clinicEmail: body.clinicEmail,
        clinicPhone: body.clinicPhone,
        clinicAddress: body.clinicAddress,
        clinicCity: body.clinicCity,
        clinicZipCode: body.clinicZipCode,
        operatingHours: body.operatingHours,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { message: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
