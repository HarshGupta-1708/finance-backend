import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }
      if (parsed.query !== undefined) {
        req.query = parsed.query;
      }
      if (parsed.params !== undefined) {
        req.params = parsed.params;
      }
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next({
          statusCode: 422,
          message: 'Validation failed',
          errors: error.errors.map((item) => ({
            field: item.path.join('.'),
            message: item.message,
          })),
        });
      }

      return next(error);
    }
  };
};
