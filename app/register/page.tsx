'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Eye, EyeOff, MailCheck } from 'lucide-react'

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'PATIENT',
    gender: '',
    dateOfBirth: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value, gender: '', dateOfBirth: '' }))
  }

  const handleGenderChange = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.role === 'PATIENT' && (!formData.gender || !formData.dateOfBirth)) {
      toast.error('Please fill in your gender and date of birth')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role: formData.role,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || 'Registration failed')
        return
      }

      // Show the "check your email" screen
      setSubmittedEmail(formData.email)
      setSubmitted(true)
    } catch {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const panelRight = (
    <div className="hidden md:block md:w-1/2 relative">
      <Image
        src="/bg.jpg"
        alt="Marinduque Provincial Hospital"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-blue-900/50" />
      <div className="absolute inset-0 flex flex-col justify-center px-12 text-white">
        <h2 className="text-4xl font-bold leading-tight mb-4 drop-shadow-lg">
          Kalinga-ni:<br />
          <span className="text-3xl font-semibold">
            Marinduque Provincial Hospital<br />
            Outpatient Department<br />
            Online Appointment System
          </span>
        </h2>
        <p className="text-white/80 text-lg font-medium drop-shadow">
          Outpatients&apos; Account
        </p>
      </div>
    </div>
  )

  // ── Check-your-email screen ──────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex">
        <div className="relative w-full md:w-1/2 flex flex-col items-center justify-center px-8 md:px-16 py-12 bg-white">
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='30,5 55,50 5,50' fill='%232d7a2d'/%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px',
            }}
          />
          <div className="relative w-full max-w-md text-center">
            <div className="flex flex-col items-center mb-6">
              <Image src="/logo.jpg" alt="Kalinga-ni Logo" width={90} height={90}
                className="rounded-xl object-contain mb-3 drop-shadow-md" />
              <h1 className="text-xl font-bold text-[#2d7a2d] tracking-wide uppercase">Kalinga-ni</h1>
              <p className="text-xs text-gray-400 mt-1 font-medium tracking-widest uppercase">
                OPD Online Appointment System
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-50 mx-auto mb-4">
                <MailCheck className="h-9 w-9 text-[#2d7a2d]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Check your email</h2>
              <p className="text-gray-500 text-sm mb-1">
                We sent a verification link to
              </p>
              <p className="font-semibold text-gray-800 text-sm mb-5">{submittedEmail}</p>
              <p className="text-gray-400 text-xs mb-6">
                Click the link in the email to activate your account. The link expires in 24 hours.
                If you don&apos;t see it, check your spam folder.
              </p>

              <Button
                onClick={handleSubmit as any}
                variant="outline"
                disabled={isLoading}
                className="w-full h-10 rounded-lg border-gray-200 text-sm text-gray-600"
                // Re-submitting triggers the resend path on the backend
                // We just fire the same form data again
                type="button"
              >
                {isLoading ? 'Resending…' : 'Resend verification email'}
              </Button>
            </div>

            <div className="mt-6">
              <Link href="/login" className="text-sm text-gray-400 hover:text-[#2d7a2d] transition">
                Already verified? Sign in
              </Link>
            </div>
          </div>
        </div>
        {panelRight}
      </div>
    )
  }

  // ── Registration form ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      {/* Left panel — form */}
      <div className="relative w-full md:w-1/2 flex flex-col items-center justify-center px-8 md:px-16 py-12 bg-white overflow-y-auto">
        {/* Triangle pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='30,5 55,50 5,50' fill='%232d7a2d'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative w-full max-w-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <Image src="/logo.jpg" alt="Kalinga-ni Logo" width={90} height={90}
              className="rounded-xl object-contain mb-3 drop-shadow-md" />
            <h1 className="text-xl font-bold text-[#2d7a2d] tracking-wide uppercase text-center">
              Kalinga-ni
            </h1>
            <p className="text-xs text-gray-400 text-center mt-1 font-medium tracking-widest uppercase">
              OPD Online Appointment System
            </p>
          </div>

          {/* Card */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-1 text-center">Create Account</h2>
            <p className="text-gray-400 text-sm text-center mb-6">
              Join Kalinga-ni to book OPD appointments online.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <Input type="text" name="firstName" value={formData.firstName}
                    onChange={handleChange} placeholder="Juan" required disabled={isLoading}
                    className="h-11 border-gray-200 focus:border-[#2d7a2d]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <Input type="text" name="lastName" value={formData.lastName}
                    onChange={handleChange} placeholder="Dela Cruz" required disabled={isLoading}
                    className="h-11 border-gray-200 focus:border-[#2d7a2d]" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="juan@example.com" required disabled={isLoading}
                  className="h-11 border-gray-200 focus:border-[#2d7a2d]" />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Phone <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <Input type="tel" name="phone" value={formData.phone}
                  onChange={handleChange} placeholder="09XX-XXX-XXXX" disabled={isLoading}
                  className="h-11 border-gray-200 focus:border-[#2d7a2d]" />
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Account Type <span className="text-red-500">*</span>
                </label>
                <Select value={formData.role} onValueChange={handleRoleChange} disabled={isLoading}>
                  <SelectTrigger className="h-11 border-gray-200">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PATIENT">Patient</SelectItem>
                    <SelectItem value="STAFF">Medical Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Gender + Date of Birth — patients only */}
              {formData.role === 'PATIENT' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <Select value={formData.gender} onValueChange={handleGenderChange} disabled={isLoading}>
                      <SelectTrigger className="h-11 border-gray-200">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <Input type="date" name="dateOfBirth" value={formData.dateOfBirth}
                      onChange={handleChange} required={formData.role === 'PATIENT'}
                      disabled={isLoading}
                      className="h-11 border-gray-200 focus:border-[#2d7a2d]" />
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} name="password"
                    value={formData.password} onChange={handleChange}
                    placeholder="Enter your password" required disabled={isLoading}
                    className="h-11 border-gray-200 focus:border-[#2d7a2d] pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input type={showConfirm ? 'text' : 'password'} name="confirmPassword"
                    value={formData.confirmPassword} onChange={handleChange}
                    placeholder="Re-enter your password" required disabled={isLoading}
                    className="h-11 border-gray-200 focus:border-[#2d7a2d] pr-10" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit"
                className="w-full h-11 bg-[#2d7a2d] hover:bg-[#245f24] text-white font-semibold rounded-lg shadow mt-2"
                disabled={isLoading}>
                {isLoading ? 'Creating account…' : 'Create Account'}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-[#2d7a2d] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-400 hover:text-[#2d7a2d] transition">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>

      {panelRight}
    </div>
  )
}