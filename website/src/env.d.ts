/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Correlation id assigned per request by src/middleware (ADR-0018). */
    requestId: string;
    /** Authenticated user when session is valid (set by auth middleware). */
    user?: {
      id: string;
      email: string;
      name: string;
      role: 'admin' | 'editor' | 'viewer';
    };
  }
}
