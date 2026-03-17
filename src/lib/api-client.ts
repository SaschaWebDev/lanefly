import type { PostgrestError } from '@supabase/supabase-js';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

export class PermissionError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'PERMISSION_ERROR', 403);
    this.name = 'PermissionError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export function handleSupabaseError(error: PostgrestError): never {
  if (error.code === 'PGRST301' || error.code === '42501') {
    throw new PermissionError(error.message);
  }
  if (error.code === 'PGRST116') {
    throw new NotFoundError(error.message);
  }
  throw new AppError(error.message, error.code, 500);
}

export function unwrapResult<T>(data: T | null, error: PostgrestError | null): T {
  if (error) {
    handleSupabaseError(error);
  }
  if (data === null) {
    throw new NotFoundError();
  }
  return data;
}
