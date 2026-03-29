'use client'

import { auth } from '@/lib/auth'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Settings } from 'lucide-react'
import { toast } from 'sonner'

interface ClinicSettings {
  id: string
  clinicName: string
  clinicEmail: string
  clinicPhone: string
  clinicAddress: string
  clinicCity: string
  clinicZipCode: string
  operatingHours: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ClinicSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await (await import('next-auth')).auth()
        if (!session?.user || session.user.role !== 'ADMIN') {
          setUnauthorized(true)
          return
        }
        setIsAdmin(true)
        fetchSettings()
      } catch (error) {
        setUnauthorized(true)
      }
    }

    checkAuth()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      toast.error('Failed to load settings')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (settings) {
      setSettings({
        ...settings,
        [name]: value,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success('Settings updated successfully')
      } else {
        toast.error('Failed to update settings')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (unauthorized) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <Card className="mt-8">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground/70">You do not have permission to access this page</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin || !settings) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-foreground/70">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Clinic Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clinic Information</CardTitle>
          <CardDescription>Update your clinic details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Clinic Name</label>
                <Input
                  type="text"
                  name="clinicName"
                  value={settings.clinicName}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <Input
                  type="email"
                  name="clinicEmail"
                  value={settings.clinicEmail}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                <Input
                  type="tel"
                  name="clinicPhone"
                  value={settings.clinicPhone}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">City</label>
                <Input
                  type="text"
                  name="clinicCity"
                  value={settings.clinicCity}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Address</label>
                <Input
                  type="text"
                  name="clinicAddress"
                  value={settings.clinicAddress}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Zip Code</label>
                <Input
                  type="text"
                  name="clinicZipCode"
                  value={settings.clinicZipCode}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Operating Hours</label>
              <Textarea
                name="operatingHours"
                value={settings.operatingHours}
                onChange={handleChange}
                rows={3}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
