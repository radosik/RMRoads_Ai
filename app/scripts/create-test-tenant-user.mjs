import { PrismaClient } from '@prisma/client'
import { hashPassword } from '@wasp.sh/lib-auth/node'

process.env.DATABASE_URL ??=
  'postgresql://postgresWaspDevUser:postgresWaspDevPass@localhost:5432/OpenSaaS-5799490bc2'

const prisma = new PrismaClient()

const testUser = {
  email: 'tenant2.planner@example.com',
  username: 'tenant2-planner',
  password: 'Tenant2Demo!2026',
}

const testOrganization = {
  name: 'Northwind Supply Test',
  slug: 'northwind-supply-test',
}

async function main() {
  const normalizedEmail = testUser.email.toLowerCase()
  const providerData = JSON.stringify({
    hashedPassword: await hashPassword(testUser.password),
    isEmailVerified: true,
    emailVerificationSentAt: null,
    passwordResetSentAt: null,
  })

  const organization = await prisma.organization.upsert({
    where: { slug: testOrganization.slug },
    update: {
      name: testOrganization.name,
      pilotMode: 'demo',
      pilotSuccessMetric: 'Validate tenant isolation with a second company workspace',
      pilotTargetDecisionHours: 4,
      securityReviewCompleted: false,
    },
    create: {
      name: testOrganization.name,
      slug: testOrganization.slug,
      pilotMode: 'demo',
      pilotSuccessMetric: 'Validate tenant isolation with a second company workspace',
      pilotTargetDecisionHours: 4,
      securityReviewCompleted: false,
    },
  })

  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      username: testUser.username,
      isAdmin: false,
    },
    create: {
      email: normalizedEmail,
      username: testUser.username,
      isAdmin: false,
    },
  })

  const auth = await prisma.auth.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  })

  await prisma.authIdentity.upsert({
    where: {
      providerName_providerUserId: {
        providerName: 'email',
        providerUserId: normalizedEmail,
      },
    },
    update: {
      authId: auth.id,
      providerData,
    },
    create: {
      providerName: 'email',
      providerUserId: normalizedEmail,
      providerData,
      authId: auth.id,
    },
  })

  const membership = await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
    update: { role: 'admin' },
    create: {
      organizationId: organization.id,
      userId: user.id,
      role: 'admin',
    },
  })

  console.log('Created or refreshed test tenant user:')
  console.log(`  Email: ${normalizedEmail}`)
  console.log(`  Password: ${testUser.password}`)
  console.log(`  Company: ${organization.name}`)
  console.log(`  Role: ${membership.role}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
