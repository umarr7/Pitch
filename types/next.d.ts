import { JWTPayload } from '@/lib/auth';

declare module 'next/server' {
  interface NextRequest {
    user?: JWTPayload;
  }
}
