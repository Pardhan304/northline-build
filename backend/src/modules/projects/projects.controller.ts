import type { Request, Response } from 'express';
import { buildPaginationMeta, sendSuccess } from '../../lib/response.js';
import type {
  AdminProjectsQuery,
  CreateProjectInput,
  PublicProjectsQuery,
  UpdateProjectInput,
} from './projects.schema.js';
import {
  archiveProject,
  createProject,
  getAdminProjectById,
  getPublicProjectBySlug,
  listAdminProjects,
  listPublicProjects,
  publishProject,
  unpublishProject,
  updateProject,
} from './projects.service.js';

export async function listPublicProjectsHandler(req: Request, res: Response): Promise<void> {
  const query = req.validated?.query as PublicProjectsQuery;
  const { items, total } = await listPublicProjects(query);
  sendSuccess(res, {
    message: 'Projects fetched successfully.',
    data: items,
    meta: buildPaginationMeta(query.page, query.limit, total),
  });
}

export async function getPublicProjectHandler(req: Request, res: Response): Promise<void> {
  const { slug } = req.validated?.params as { slug: string };
  const project = await getPublicProjectBySlug(slug);
  sendSuccess(res, {
    message: 'Project fetched successfully.',
    data: project,
  });
}

export async function listAdminProjectsHandler(req: Request, res: Response): Promise<void> {
  const query = req.validated?.query as AdminProjectsQuery;
  const { items, total } = await listAdminProjects(query);
  sendSuccess(res, {
    message: 'Admin projects fetched successfully.',
    data: items,
    meta: buildPaginationMeta(query.page, query.limit, total),
  });
}

export async function getAdminProjectHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.validated?.params as { id: string };
  const project = await getAdminProjectById(id);
  sendSuccess(res, {
    message: 'Project fetched successfully.',
    data: project,
  });
}

export async function createProjectHandler(req: Request, res: Response): Promise<void> {
  const body = req.validated?.body as CreateProjectInput;
  const project = await createProject(body, req.user!.id);
  sendSuccess(res, {
    statusCode: 201,
    message: 'Project created successfully.',
    data: project,
  });
}

export async function updateProjectHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as UpdateProjectInput;
  const project = await updateProject(id, body, req.user!.id);
  sendSuccess(res, {
    message: 'Project updated successfully.',
    data: project,
  });
}

export async function publishProjectHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.validated?.params as { id: string };
  const project = await publishProject(id, req.user!.id);
  sendSuccess(res, {
    message: 'Project published successfully.',
    data: project,
  });
}

export async function unpublishProjectHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.validated?.params as { id: string };
  const project = await unpublishProject(id, req.user!.id);
  sendSuccess(res, {
    message: 'Project unpublished successfully.',
    data: project,
  });
}

export async function archiveProjectHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.validated?.params as { id: string };
  await archiveProject(id, req.user!.id);
  sendSuccess(res, {
    message: 'Project archived successfully.',
    data: null,
  });
}
