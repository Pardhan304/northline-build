import type { Request, Response } from 'express';
import { buildPaginationMeta, sendSuccess } from '../../lib/response.js';
import type { ListMediaQuery, UpdateMediaInput } from './media.schema.js';
import { deleteMedia, listMedia, updateMediaAltText, uploadImageMedia } from './media.service.js';

export async function listMediaHandler(req: Request, res: Response): Promise<void> {
  const query = req.validated?.query as ListMediaQuery;
  const { items, total } = await listMedia(query);
  sendSuccess(res, {
    message: 'Media assets fetched successfully.',
    data: items,
    meta: buildPaginationMeta(query.page, query.limit, total),
  });
}

export async function uploadMediaHandler(req: Request, res: Response): Promise<void> {
  const altText = typeof req.body?.altText === 'string' ? req.body.altText : '';
  const created = await uploadImageMedia(req.file, altText, req.user!.id);
  sendSuccess(res, {
    statusCode: 201,
    message: 'Media uploaded successfully.',
    data: created,
  });
}

export async function updateMediaHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as UpdateMediaInput;
  const updated = await updateMediaAltText(id, body, req.user!.id);
  sendSuccess(res, {
    message: 'Media updated successfully.',
    data: updated,
  });
}

export async function deleteMediaHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.validated?.params as { id: string };
  await deleteMedia(id, req.user!.id);
  sendSuccess(res, {
    message: 'Media deleted successfully.',
    data: null,
  });
}
