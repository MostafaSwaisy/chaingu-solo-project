import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { AppError } from '../src/utils/AppError.js';

function buildTestApp(routeHandler) {
  const app = express();
  app.get('/boom', routeHandler);
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('formats an AppError with its status code and code', async () => {
    const app = buildTestApp((req, res, next) => next(new AppError('nope', 400, 'BAD_INPUT')));
    const res = await request(app).get('/boom');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { message: 'nope', code: 'BAD_INPUT' } });
  });

  it('returns a generic 500 for an unexpected error', async () => {
    const app = buildTestApp((req, res, next) => next(new Error('unexpected')));
    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { message: 'internal server error', code: 'INTERNAL_ERROR' } });
  });
});
