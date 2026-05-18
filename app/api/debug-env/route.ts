import { NextResponse } from 'next/server'

function mask(value: string | undefined): string {
  if (!value) return '(não definida)'
  if (value.length <= 6) return '***'
  return value.slice(0, 3) + '***' + value.slice(-3)
}

export async function GET() {
  return NextResponse.json({
    server: {
      JWT_ACCESS_SECRET:  mask(process.env.JWT_ACCESS_SECRET),
      JWT_ISSUER:         process.env.JWT_ISSUER         ?? '(não definida)',
      JWT_AUDIENCE:       process.env.JWT_AUDIENCE       ?? '(não definida)',
      NODE_ENV:           process.env.NODE_ENV           ?? '(não definida)',
    },
    buildtime: {
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '(não definida — baked in vazia no build!)',
    },
  })
}
