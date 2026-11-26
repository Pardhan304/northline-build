import type { Request, Response } from 'express';
import { buildPaginationMeta, sendSuccess } from '../../lib/response.js';
import type {
  CreateEnquiryInput,
  ListEnquiriesQuery,
  UpdateEnquiryInput,
} from './enquiries.schema.js';
import {
  deleteAdminEnquiry,
  getAdminEnquiryById,
  listAdminEnquiries,
  submitEnquiry,
  updateAdminEnquiry,
} from './enquiries.service.js';

export async function submitEnquiryHandler(req: Request, res: Response): Promise<void> {
  const body = req.validated?.body as CreateEnquiryInput;
  const receipt = await submitEnquiry(body);
  sendSuccess(res, {
    statusCode: 201,
    message: 'Your enquiry has been received.',
    data: receipt,
  });
}

export async function listAdminEnquiriesHandler(req: Request, res: Response): Promise<void> {
  const query = req.validated?.query as ListEnquiriesQuery;
  const { items, total } = await listAdminEnquiries(query);
  sendSuccess(res, {
    message: 'Enquiries fetched successfully.',
    data: items,
    meta: buildPaginationMeta(query.page, query.limit, total),
  });
}

export async function getAdminEnquiryHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.validated?.params as { id: string };
  const enquiry = await getAdminEnquiryById(id);
  sendSuccess(res, {
    message: 'Enquiry fetched successfully.',
    data: enquiry,
  });
}

export async function updateAdminEnquiryHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as UpdateEnquiryInput;
  const updated = await updateAdminEnquiry(id, body, req.user!.id);
  sendSuccess(res, {
    message: 'Enquiry updated successfully.',
    data: updated,
  });
}

export async function deleteAdminEnquiryHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.validated?.params as { id: string };
  await deleteAdminEnquiry(id, req.user!.id);
  sendSuccess(res, {
    message: 'Enquiry deleted successfully.',
    data: null,
  });
}
