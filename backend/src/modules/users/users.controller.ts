import type { Request, Response } from 'express';
import { buildPaginationMeta, sendSuccess } from '../../lib/response.js';
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from './users.schema.js';
import { createUser, listUsers, updateUser } from './users.service.js';

export async function getUsersHandler(req: Request, res: Response): Promise<void> {
  const query = req.validated?.query as ListUsersQuery;
  const { items, total } = await listUsers(query);
  sendSuccess(res, {
    message: 'Users fetched successfully.',
    data: items,
    meta: buildPaginationMeta(query.page, query.limit, total),
  });
}

export async function createUserHandler(req: Request, res: Response): Promise<void> {
  const body = req.validated?.body as CreateUserInput;
  const created = await createUser(body, req.user!.id);
  sendSuccess(res, {
    statusCode: 201,
    message: 'User created successfully.',
    data: created,
  });
}

export async function updateUserHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.validated?.params as { id: string };
  const body = req.validated?.body as UpdateUserInput;
  const updated = await updateUser(id, body, req.user!.id);
  sendSuccess(res, {
    message: 'User updated successfully.',
    data: updated,
  });
}
