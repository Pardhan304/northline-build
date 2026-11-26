import type { Request, Response } from 'express';
import { sendSuccess } from '../../lib/response.js';
import type { UpdatePageInput } from './pages.schema.js';
import {
  getAdminPageBySlug,
  getPublicPageBySlug,
  listAdminPages,
  updateAdminPage,
} from './pages.service.js';

export async function getPublicPageHandler(req: Request, res: Response): Promise<void> {
  const { slug } = req.validated?.params as { slug: string };
  const page = await getPublicPageBySlug(slug);
  sendSuccess(res, {
    message: 'Page fetched successfully.',
    data: page,
  });
}

export async function listAdminPagesHandler(_req: Request, res: Response): Promise<void> {
  const pages = await listAdminPages();
  sendSuccess(res, {
    message: 'Admin pages fetched successfully.',
    data: pages,
  });
}

export async function getAdminPageHandler(req: Request, res: Response): Promise<void> {
  const { slug } = req.validated?.params as { slug: string };
  const page = await getAdminPageBySlug(slug);
  sendSuccess(res, {
    message: 'Admin page fetched successfully.',
    data: page,
  });
}

export async function updateAdminPageHandler(req: Request, res: Response): Promise<void> {
  const { slug } = req.validated?.params as { slug: string };
  const body = req.validated?.body as UpdatePageInput;
  const updated = await updateAdminPage(slug, body, req.user!.id);
  sendSuccess(res, {
    message: 'Page updated successfully.',
    data: updated,
  });
}
