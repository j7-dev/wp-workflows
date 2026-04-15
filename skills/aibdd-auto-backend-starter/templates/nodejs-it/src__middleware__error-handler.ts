import { Request, Response, NextFunction } from 'express';
import { BusinessError, NotFoundError } from '../errors';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof NotFoundError) {
    res.status(404).json({ message: err.message });
    return;
  }
  if (err instanceof BusinessError) {
    res.status(400).json({ message: err.message });
    return;
  }
  console.error('Unexpected error:', err);
  res.status(500).json({ message: 'Internal server error' });
}
