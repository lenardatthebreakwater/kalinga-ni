'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Users,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'

interface ScheduleSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  slotDuration: number
  isAvailable: boolean
  bookedCount: number
  totalSlots: number
  availableSlots: number
}

function getWeekDates(weekOffset: number) {
  const now = new Date()
  const monday = new Date(now)
  const day = monday.getDay()
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function toInputDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function SchedulePage() {
  const { data: session } = useSession()
  const [weekOffset, setWeekOffset] = useState(0)
  const [slots, setSlots] = useState<ScheduleSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ScheduleSlot | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null)

  const [form, setForm] = useState({
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: '30',
  })

  const weekDates = getWeekDates(weekOffset)
  const weekStart = weekDates[0]
  const weekEnd = weekDates[6]

  const fetchSchedule = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)
    try {
      const meRes = await fetch('/api/schedule/me')
      if (!meRes.ok) throw new Error('Failed to fetch staff info')
      const { staffId: sid } = await meRes.json()
      const from = toInputDate(weekStart)
      const to = toInputDate(weekEnd)
      const res = await fetch(`/api/schedule?staffId=${sid}&from=${from}&to=${to}`)
      if (!res.ok) throw new Error('Failed to fetch schedule')
      setSlots(await res.json())
    } catch {
      toast.error('Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }, [weekOffset, session])

  useEffect(() => { fetchSchedule() }, [fetchSchedule])

  const handleAddSlot = async () => {
    if (!selectedDate || !form.startTime || !form.endTime) {
      setError('Please fill in all fields')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          startTime: form.startTime,
          endTime: form.endTime,
          slotDuration: parseInt(form.slotDuration),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create slot')
      }
      toast.success('Availability added successfully')
      setShowAddDialog(false)
      setSelectedDate('')
      setForm({ startTime: '09:00', endTime: '17:00', slotDuration: '30' })
      fetchSchedule()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create slot')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleAvailability = async (slot: ScheduleSlot) => {
    try {
      const res = await fetch(`/api/schedule/${slot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !slot.isAvailable }),
      })
      if (!res.ok) throw new Error()
      toast.success(slot.isAvailable ? 'Marked as unavailable' : 'Marked as available')
      setSelectedSlot(null)
      fetchSchedule()
    } catch {
      toast.error('Failed to update slot')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/schedule/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete slot')
      }
      toast.success('Slot removed')
      setDeleteTarget(null)
      setSelectedSlot(null)
      fetchSchedule()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete slot')
    } finally {
      setSubmitting(false)
    }
  }

  const getSlotsForDate = (date: Date) => {
  const dateStr = toInputDate(date)
  return slots.filter((s) => {
    // s.date is a UTC ISO string like "2025-04-09T00:00:00.000Z"
    // Parse it and convert to local date string for comparison
    const slotLocal = toInputDate(new Date(s.date))
    return slotLocal === dateStr
  })
}

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  }

  const isPast = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  // Summary stats for the week
  const totalSlots = slots.reduce((a, s) => a + s.totalSlots, 0)
  const totalBooked = slots.reduce((a, s) => a + s.bookedCount, 0)
  const totalAvailable = slots.reduce((a, s) => a + s.availableSlots, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your weekly availability for patient bookings</p>
        </div>
        <Button
          onClick={() => {
            setSelectedDate(toInputDate(weekDates.find((d) => !isPast(d)) ?? weekDates[0]))
            setShowAddDialog(true)
          }}
          className="bg-[#2d7a2d] hover:bg-[#245f24] text-white rounded-xl h-10 px-5 font-semibold shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Availability
        </Button>
      </div>

      <div className="px-8 py-6 max-w-7xl mx-auto">

        {/* Week stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Slots This Week', value: totalSlots, icon: Calendar, color: 'text-gray-600', bg: 'bg-gray-100' },
            { label: 'Appointments Booked', value: totalBooked, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Slots Still Available', value: totalAvailable, icon: CheckCircle2, color: 'text-[#2d7a2d]', bg: 'bg-[#2d7a2d]/10' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{loading ? '—' : stat.value}</p>
                <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Week navigator */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">
              {MONTH_NAMES[weekStart.getMonth()]} {weekStart.getDate()} – {MONTH_NAMES[weekEnd.getMonth()]} {weekEnd.getDate()}, {weekEnd.getFullYear()}
            </span>
            {weekOffset === 0 && (
              <Badge className="bg-[#2d7a2d] text-white text-xs px-2 py-0.5 rounded-full">This Week</Badge>
            )}
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-xs text-[#2d7a2d] font-medium hover:underline"
              >
                Back to today
              </button>
            )}
          </div>

          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-7 w-7 animate-spin text-[#2d7a2d]" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-3">
            {weekDates.map((date, i) => {
              const daySlots = getSlotsForDate(date)
              const past = isPast(date)
              const today = isToday(date)

              return (
                <div
                  key={toInputDate(date)}
                  className={`rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col transition-all ${
                    today
                      ? 'border-[#2d7a2d] ring-2 ring-[#2d7a2d]/20'
                      : 'border-gray-100'
                  } ${past ? 'opacity-50' : ''}`}
                >
                  {/* Day header */}
                  <div className={`px-3 py-3 text-center ${today ? 'bg-[#2d7a2d]' : 'bg-gray-50 border-b border-gray-100'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${today ? 'text-green-200' : 'text-gray-400'}`}>
                      {DAY_LABELS[i]}
                    </p>
                    <p className={`text-xl font-black ${today ? 'text-white' : 'text-gray-800'}`}>
                      {date.getDate()}
                    </p>
                    {today && (
                      <p className="text-[10px] text-green-200 font-semibold mt-0.5">Today</p>
                    )}
                  </div>

                  {/* Slot list */}
                  <div className="flex-1 p-2 space-y-2">
                    {daySlots.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-5 text-center">
                        <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                          <Clock className="h-3.5 w-3.5 text-gray-300" />
                        </div>
                        <p className="text-[10px] text-gray-300 font-medium">No availability</p>
                      </div>
                    ) : (
                      daySlots.map((slot) => {
                        const fillPct = slot.totalSlots > 0
                          ? Math.round((slot.bookedCount / slot.totalSlots) * 100)
                          : 0
                        const isFull = slot.bookedCount >= slot.totalSlots

                        return (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot)}
                            className={`w-full text-left rounded-xl p-2.5 border transition-all hover:shadow-md active:scale-95 ${
                              !slot.isAvailable
                                ? 'bg-gray-50 border-gray-200 opacity-60'
                                : isFull
                                ? 'bg-orange-50 border-orange-200'
                                : 'bg-[#2d7a2d]/5 border-[#2d7a2d]/20 hover:bg-[#2d7a2d]/10'
                            }`}
                          >
                            {/* Time range */}
                            <p className="text-[11px] font-bold text-gray-700 mb-1">
                              {formatTime(slot.startTime)}
                            </p>
                            <p className="text-[10px] text-gray-400 mb-2">
                              to {formatTime(slot.endTime)}
                            </p>

                            {/* Fill bar */}
                            <div className="h-1 w-full rounded-full bg-gray-200 mb-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isFull ? 'bg-orange-400' : 'bg-[#2d7a2d]'
                                }`}
                                style={{ width: `${fillPct}%` }}
                              />
                            </div>

                            {/* Booking count */}
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-semibold ${
                                isFull ? 'text-orange-600' : 'text-[#2d7a2d]'
                              }`}>
                                {slot.bookedCount}/{slot.totalSlots}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                !slot.isAvailable
                                  ? 'bg-gray-200 text-gray-500'
                                  : isFull
                                  ? 'bg-orange-100 text-orange-600'
                                  : 'bg-[#2d7a2d]/10 text-[#2d7a2d]'
                              }`}>
                                {!slot.isAvailable ? 'Off' : isFull ? 'Full' : 'Open'}
                              </span>
                            </div>
                          </button>
                        )
                      })
                    )}

                    {/* Add button for future days */}
                    {!past && (
                      <button
                        onClick={() => {
                          setSelectedDate(toInputDate(date))
                          setShowAddDialog(true)
                        }}
                        className="w-full rounded-xl border-2 border-dashed border-gray-200 py-2 text-[11px] text-gray-300 hover:text-[#2d7a2d] hover:border-[#2d7a2d]/40 hover:bg-[#2d7a2d]/5 transition-all flex items-center justify-center gap-1 font-medium"
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-6 mt-5 justify-end">
          {[
            { color: 'bg-[#2d7a2d]/20 border-[#2d7a2d]/30', label: 'Available' },
            { color: 'bg-orange-100 border-orange-200', label: 'Fully booked' },
            { color: 'bg-gray-100 border-gray-200', label: 'Unavailable' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded border ${item.color}`} />
              <span className="text-xs text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Slot detail panel */}
      <AlertDialog open={!!selectedSlot} onOpenChange={(o) => { if (!o) setSelectedSlot(null) }}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-[#2d7a2d]" />
              Slot Details
            </AlertDialogTitle>
          </AlertDialogHeader>
          {selectedSlot && (
            <div className="space-y-4 py-1">
              {/* Date & time */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(selectedSlot.date).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Time window</span>
                  <span className="font-semibold text-gray-800">
                    {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Slot duration</span>
                  <span className="font-semibold text-gray-800">{selectedSlot.slotDuration} min</span>
                </div>
              </div>

              {/* Booking status */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-500">Bookings</span>
                  <span className="font-bold text-gray-800">
                    {selectedSlot.bookedCount} / {selectedSlot.totalSlots} filled
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedSlot.bookedCount >= selectedSlot.totalSlots
                        ? 'bg-orange-400'
                        : 'bg-[#2d7a2d]'
                    }`}
                    style={{
                      width: `${selectedSlot.totalSlots > 0
                        ? Math.round((selectedSlot.bookedCount / selectedSlot.totalSlots) * 100)
                        : 0}%`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {selectedSlot.availableSlots} slot{selectedSlot.availableSlots !== 1 ? 's' : ''} still open for booking
                </p>
              </div>

              {/* Status */}
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                selectedSlot.isAvailable
                  ? 'bg-[#2d7a2d]/8 text-[#2d7a2d]'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {selectedSlot.isAvailable
                  ? <CheckCircle2 className="h-4 w-4" />
                  : <XCircle className="h-4 w-4" />}
                {selectedSlot.isAvailable ? 'Accepting bookings' : 'Not accepting bookings'}
              </div>

              {selectedSlot.bookedCount > 0 && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  {selectedSlot.bookedCount} appointment{selectedSlot.bookedCount > 1 ? 's are' : ' is'} already booked in this slot.
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={() => handleToggleAvailability(selectedSlot)}
                  className="flex-1 rounded-xl text-sm h-9"
                >
                  {selectedSlot.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                </Button>
                <Button
                  onClick={() => {
                    setDeleteTarget(selectedSlot)
                    setSelectedSlot(null)
                  }}
                  className="flex-1 rounded-xl text-sm h-9 bg-red-500 hover:bg-red-600 text-white"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Remove
                </Button>
              </div>

              <button
                onClick={() => setSelectedSlot(null)}
                className="w-full text-xs text-gray-400 hover:text-gray-600 pt-1"
              >
                Close
              </button>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Add slot dialog */}
      <AlertDialog open={showAddDialog} onOpenChange={(o) => { if (!o) { setShowAddDialog(false); setError('') } }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#2d7a2d]" />
              Add Availability
            </AlertDialogTitle>
            <AlertDialogDescription>
              Set a time window when patients can book appointments with you.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                min={toInputDate(new Date())}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Visual duration preview */}
            {form.startTime && form.endTime && form.startTime < form.endTime && (
              <div className="bg-[#2d7a2d]/5 border border-[#2d7a2d]/20 rounded-xl px-4 py-3 text-sm text-[#2d7a2d]">
                <p className="font-semibold mb-1">
                  {formatTime(form.startTime)} – {formatTime(form.endTime)}
                </p>
                <p className="text-xs text-[#2d7a2d]/70">
                  {Math.floor(
                    (parseInt(form.endTime.split(':')[0]) * 60 + parseInt(form.endTime.split(':')[1]) -
                    (parseInt(form.startTime.split(':')[0]) * 60 + parseInt(form.startTime.split(':')[1]))) /
                    parseInt(form.slotDuration)
                  )} patient slots × {form.slotDuration} min each
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Appointment Duration</Label>
              <Select
                value={form.slotDuration}
                onValueChange={(v) => setForm({ ...form, slotDuration: v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes per patient</SelectItem>
                  <SelectItem value="30">30 minutes per patient</SelectItem>
                  <SelectItem value="45">45 minutes per patient</SelectItem>
                  <SelectItem value="60">1 hour per patient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <AlertDialogCancel disabled={submitting} className="rounded-xl">Cancel</AlertDialogCancel>
            <Button
              onClick={handleAddSlot}
              disabled={submitting}
              className="bg-[#2d7a2d] hover:bg-[#245f24] text-white rounded-xl"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {submitting ? 'Adding...' : 'Add Availability'}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this slot?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <span>
                  This will remove your availability on{' '}
                  <strong>
                    {new Date(deleteTarget.date).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric',
                    })}
                  </strong>{' '}
                  from <strong>{formatTime(deleteTarget.startTime)}</strong> to{' '}
                  <strong>{formatTime(deleteTarget.endTime)}</strong>.
                  {deleteTarget.bookedCount > 0 && (
                    <span className="block mt-2 text-red-600 font-semibold">
                      ⚠ {deleteTarget.bookedCount} patient appointment{deleteTarget.bookedCount > 1 ? 's are' : ' is'} booked in this window.
                    </span>
                  )}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel disabled={submitting} className="rounded-xl">Cancel</AlertDialogCancel>
            <Button
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {submitting ? 'Removing...' : 'Remove Slot'}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}