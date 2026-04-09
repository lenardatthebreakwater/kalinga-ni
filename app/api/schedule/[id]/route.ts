import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/schedule/[id] — toggle availability or update slot
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const slot = await prisma.staffSchedule.findUnique({
      where: { id },
      include: { staff: true },
    })

    if (!slot) {
      return NextResponse.json({ error: 'Schedule slot not found' }, { status: 404 })
    }

    // Only the owning staff or admin can update
    if (
      session.user.role !== 'ADMIN' &&
      slot.staff.userId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { isAvailable, startTime, endTime, slotDuration } = body

    const updated = await prisma.staffSchedule.update({
      where: { id },
      data: {
        ...(isAvailable !== undefined && { isAvailable }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(slotDuration && { slotDuration }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating schedule slot:', error)
    return NextResponse.json({ error: 'Failed to update schedule slot' }, { status: 500 })
  }
}

// DELETE /api/schedule/[id] — remove a slot (only if no appointments booked in it)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const slot = await prisma.staffSchedule.findUnique({
      where: { id },
      include: { staff: true },
    })

    if (!slot) {
      return NextResponse.json({ error: 'Schedule slot not found' }, { status: 404 })
    }

    // Only the owning staff or admin can delete
    if (
      session.user.role !== 'ADMIN' &&
      slot.staff.userId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if any appointments are booked within this slot
    const slotStart = new Date(slot.date)
    const [startHour, startMin] = slot.startTime.split(':').map(Number)
    const [endHour, endMin] = slot.endTime.split(':').map(Number)
    slotStart.setHours(startHour, startMin, 0, 0)

    const slotEnd = new Date(slot.date)
    slotEnd.setHours(endHour, endMin, 0, 0)

    const bookedAppointments = await prisma.appointment.count({
      where: {
        staffId: slot.staffId,
        status: 'SCHEDULED',
        appointmentDate: {
          gte: slotStart,
          lt: slotEnd,
        },
      },
    })

    if (bookedAppointments > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete this slot — ${bookedAppointments} appointment${bookedAppointments > 1 ? 's are' : ' is'} already booked within it.`,
        },
        { status: 409 }
      )
    }

    await prisma.staffSchedule.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting schedule slot:', error)
    return NextResponse.json({ error: 'Failed to delete schedule slot' }, { status: 500 })
  }
}