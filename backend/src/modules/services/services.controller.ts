import type { Request, Response } from 'express';
import { sendSuccess } from '../../lib/response.js';
import type { CreateServiceInput, UpdateServiceInput } from './services.schema.js';
import {
  archiveService,
  createService,
  listAdminServices,
  listPublicServices,
  updateService,
} from './services.service.js';

export async function listPublicServicesHandler(_req: Request, res: Response): Promise<void> {
  const services = await listPublicServices();
  sendSuccess(res, {
    message: 'Services fetched successfully.',
    data: services,
  });
}

export async function listAdminServicesHandler(_req: Request, res: Response): Promise<void> {
  const services = await listAdminServices();
  sendSuccess(res, {
    message: 'Admin services fetched successfully.',
    data: services,
  });
}

export async function createServiceHandler(req: Request, res: Response): Promise<void> {
  const body = req.validated?.body as CreateServiceInput;
  const service = await createService(body, req.user!.id);
  sendSuccess(res, {
    statusCode: 201,
    message: 'Service created successfully.',
    data: service,
  });
}

export async function updateServiceHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as UpdateServiceInput;
  const service = await updateService(id, body, req.user!.id);
  sendSuccess(res, {
    message: 'Service updated successfully.',
    data: service,
  });
}

export async function archiveServiceHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.validated?.params as { id: string };
  await archiveService(id, req.user!.id);
  sendSuccess(res, {
    message: 'Service archived successfully.',
    data: null,
  });
}
