/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Correlation id assigned per request by src/middleware (ADR-0018). */
    requestId: string;
  }
}
