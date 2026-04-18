'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type State = 'loading' | 'success' | 'already_verified' | 'error'

function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [state, setState] = useState<State>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('No verification token found in the link.')
      return
    }

    async function verify() {
      try {
        const res = await fetch(`/api/auth/verify?token=${token}`)
        const data = await res.json()

        if (res.ok) {
          if (data.message.includes('already verified')) {
            setState('already_verified')
          } else {
            setState('success')
          }
        } else {
          setState('error')
          setMessage(data.message ?? 'Verification failed.')
        }
      } catch {
        setState('error')
        setMessage('Something went wrong. Please try again.')
      }
    }

    verify()
  }, [token])

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-8 text-center">
      {state === 'loading' && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-[#2d7a2d] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Verifying your email…</h2>
          <p className="text-gray-400 text-sm">Please wait a moment.</p>
        </>
      )}

      {state === 'success' && (
        <>
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-50 mx-auto mb-4">
            <CheckCircle2 className="h-9 w-9 text-[#2d7a2d]" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Email Verified!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your account has been activated. You can now log in and start booking appointments.
          </p>
          <Button
            onClick={() => router.push('/login')}
            className="w-full h-11 bg-[#2d7a2d] hover:bg-[#245f24] text-white font-semibold rounded-lg"
          >
            Go to Login
          </Button>
        </>
      )}

      {state === 'already_verified' && (
        <>
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 mx-auto mb-4">
            <CheckCircle2 className="h-9 w-9 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Already Verified</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your account is already active. You can log in right away.
          </p>
          <Button
            onClick={() => router.push('/login')}
            className="w-full h-11 bg-[#2d7a2d] hover:bg-[#245f24] text-white font-semibold rounded-lg"
          >
            Go to Login
          </Button>
        </>
      )}

      {state === 'error' && (
        <>
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-50 mx-auto mb-4">
            <XCircle className="h-9 w-9 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Verification Failed</h2>
          <p className="text-gray-500 text-sm mb-6">{message}</p>
          <Button
            onClick={() => router.push('/register')}
            className="w-full h-11 bg-[#2d7a2d] hover:bg-[#245f24] text-white font-semibold rounded-lg"
          >
            Back to Register
          </Button>
        </>
      )}
    </div>
  )
}

function VerifyFallback() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-8 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-[#2d7a2d] mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-800 mb-2">Verifying your email…</h2>
      <p className="text-gray-400 text-sm">Please wait a moment.</p>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.jpg"
            alt="Kalinga-ni Logo"
            width={80}
            height={80}
            className="rounded-xl object-contain mb-3 drop-shadow-md"
          />
          <h1 className="text-xl font-bold text-[#2d7a2d] tracking-wide uppercase">Kalinga-ni</h1>
          <p className="text-xs text-gray-400 mt-1 font-medium tracking-widest uppercase">
            OPD Online Appointment System
          </p>
        </div>

        <Suspense fallback={<VerifyFallback />}>
          <VerifyContent />
        </Suspense>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-[#2d7a2d] transition">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}