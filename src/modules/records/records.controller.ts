import { NextFunction, Request, Response } from 'express';
import * as recordsService from './records.service';
import { sendSuccess } from '../../utils/apiResponse';

export const createRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const record = await recordsService.createRecord(
      req.user!.id,
      req.user!.role,
      req.body,
      req.ip,
    );
    return sendSuccess(res, record, 'Record created', 201);
  } catch (error) {
    return next(error);
  }
};

export const getRecords = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await recordsService.getRecords(
      req.query as any,
      req.user!.id,
      req.user!.role,
    );

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
};

export const getRecordById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const record = await recordsService.getRecordById(
      req.params.id,
      req.user!.id,
      req.user!.role,
    );

    return sendSuccess(res, record);
  } catch (error) {
    return next(error);
  }
};

export const updateRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const record = await recordsService.updateRecord(
      req.params.id,
      req.user!.id,
      req.user!.role,
      req.body,
      req.ip,
    );

    return sendSuccess(res, record, 'Record updated');
  } catch (error) {
    return next(error);
  }
};

export const deleteRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await recordsService.deleteRecord(req.params.id, req.user!.id, req.user!.role, req.ip);
    return sendSuccess(res, null, 'Record deleted');
  } catch (error) {
    return next(error);
  }
};
