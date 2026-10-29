import mongoose from 'mongoose';
import multer from 'multer';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notFound = (what = 'Resource') => new HttpError(404, `${what} not found`);

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: err.issues[0]?.message ?? 'Validation failed',
      errors: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, ...(err.details && { details: err.details }) });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: err.message });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: `Invalid ${err.path}` });
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'Value';
    return res.status(409).json({ message: `${field} "${err.keyValue?.[field]}" already exists` });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON body' });
  }

  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
}
