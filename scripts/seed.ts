import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Clear existing data
  await prisma.medicalRecord.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.user.deleteMany()
  await prisma.clinicSettings.deleteMany()

  // Clinic settings
  await prisma.clinicSettings.create({
    data: {
      clinicName: 'Kalinga-ni Clinic',
      clinicEmail: 'contact@kalinga-ni.com',
      clinicPhone: '+63-2-1234-5678',
      clinicAddress: '123 Healthcare Street',
      clinicCity: 'Boac, Marinduque',
      clinicZipCode: '4900',
      operatingHours: '8:00 AM - 5:00 PM, Monday to Friday',
    },
  })

  const adminPassword   = await bcrypt.hash('admin123', 10)
  const staffPassword   = await bcrypt.hash('staff123', 10)
  const patientPassword = await bcrypt.hash('patient123', 10)

  // Admin
  await prisma.user.create({
    data: {
      email: 'admin@kalinga-ni.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: '+63-9000000000',
    },
  })

  // Staff
  const staffUser = await prisma.user.create({
    data: {
      email: 'dr.santos@kalinga-ni.com',
      password: staffPassword,
      firstName: 'Maria',
      lastName: 'Santos',
      role: 'STAFF',
      status: 'ACTIVE',
      phone: '+63-9111111111',
    },
  })

  await prisma.staff.create({
    data: {
      userId: staffUser.id,
      specialization: 'General Medicine',
      licenseNumber: 'LIC-001',
      department: 'General',
    },
  })

  // Patient
  const patientUser = await prisma.user.create({
    data: {
      email: 'john.doe@email.com',
      password: patientPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'PATIENT',
      status: 'ACTIVE',
      phone: '+63-9333333333',
    },
  })

  await prisma.patient.create({
    data: {
      userId: patientUser.id,
      dateOfBirth: new Date('1990-05-15'),
      gender: 'Male',
      bloodType: 'O+',
      allergies: 'Penicillin',
      emergencyContact: 'Mary Doe',
      emergencyPhone: '+63-9555555555',
    },
  })

  console.log('Seed completed!')
  console.log('\nTest Credentials:')
  console.log('Admin:   admin@kalinga-ni.com   / admin123')
  console.log('Staff:   dr.santos@kalinga-ni.com / staff123')
  console.log('Patient: john.doe@email.com      / patient123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })