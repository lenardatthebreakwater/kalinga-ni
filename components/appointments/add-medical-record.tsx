'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, FilePlus } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface AddMedicalRecordProps {
  appointmentId: string
  patientId: string
  patientName: string
  appointmentDate: Date | string
  reason: string
}

export default function AddMedicalRecord({
  appointmentId,
  patientId,
  patientName,
  appointmentDate,
  reason,
}: AddMedicalRecordProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    diagnosis: '',
    treatment: '',
    medications: '',
    notes: '',
  })

  const handleSubmit = async () => {
    if (!form.diagnosis.trim() || !form.treatment.trim()) {
      setError('Diagnosis and treatment are required')
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          patientId,
          diagnosis: form.diagnosis,
          treatment: form.treatment,
          medications: form.medications || null,
          notes: form.notes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create medical record')
      }

      setOpen(false)
      setForm({ diagnosis: '', treatment: '', medications: '', notes: '' })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create medical record')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="text-[#2d7a2d] border-[#2d7a2d]/30 hover:bg-[#2d7a2d]/10 hover:text-[#2d7a2d]"
      >
        <FilePlus className="h-4 w-4 mr-1" />
        Add Record
      </Button>

      <AlertDialog open={open} onOpenChange={(o) => {
        if (!o) {
          setError('')
          setForm({ diagnosis: '', treatment: '', medications: '', notes: '' })
        }
        setOpen(o)
      }}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Add Medical Record</AlertDialogTitle>
            <AlertDialogDescription>
              Patient: <span className="font-medium text-gray-700">{patientName}</span>
              {' · '}
              {new Date(appointmentDate).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
              <br />
              Reason: {reason}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="diagnosis">
                Diagnosis <span className="text-red-500">*</span>
              </Label>
              <Input
                id="diagnosis"
                placeholder="e.g. Acute upper respiratory infection"
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                disabled={loading}
                className="border-gray-200 focus:border-[#2d7a2d]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="treatment">
                Treatment <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="treatment"
                placeholder="Describe the treatment plan"
                value={form.treatment}
                onChange={(e) => setForm({ ...form, treatment: e.target.value })}
                disabled={loading}
                className="border-gray-200 focus:border-[#2d7a2d] min-h-20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="medications">
                Medications <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="medications"
                placeholder="e.g. Amoxicillin 500mg 3x daily for 7 days"
                value={form.medications}
                onChange={(e) => setForm({ ...form, medications: e.target.value })}
                disabled={loading}
                className="border-gray-200 focus:border-[#2d7a2d] min-h-20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">
                Notes <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or follow-up instructions"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                disabled={loading}
                className="border-gray-200 focus:border-[#2d7a2d] min-h-20"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#2d7a2d] hover:bg-[#245f24] text-white"
            >
              {loading ? 'Saving...' : 'Save Record'}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}