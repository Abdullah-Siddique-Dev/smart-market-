import { db } from '../db/connection.js';
import { PAGINATION } from '../config/constants.js';
import { PaginationMeta } from './response.js';

export interface PaginationOptions {
  page?: number | string;
  limit?: number | string;
}

export function parsePaginationParams(query: { page?: unknown; limit?: unknown }): {
  page: number;
  limit: number;
  offset: number;
} {
  const page = Math.max(1, parseInt(String(query.page || PAGINATION.DEFAULT_PAGE), 10) || 1);
  const rawLimit = parseInt(String(query.limit || PAGINATION.DEFAULT_LIMIT), 10) || PAGINATION.DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, rawLimit), PAGINATION.MAX_LIMIT);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function executePaginatedQuery<T>(
  dataSql: string,
  countSql: string,
  params: (string | number | null | undefined)[] = [],
  paginationParams: { page: number; limit: number; offset: number }
): { data: T[]; pagination: PaginationMeta } {
  const { page, limit, offset } = paginationParams;

  // Execute Count
  const countRow = db.prepare(countSql).get(...params) as { count: number };
  const totalRecords = countRow?.count ?? 0;
  const totalPages = Math.ceil(totalRecords / limit) || 1;

  // Execute Paginated Select
  const paginatedSql = `${dataSql} LIMIT ? OFFSET ?`;
  const data = db.prepare(paginatedSql).all(...params, limit, offset) as T[];

  const pagination: PaginationMeta = {
    page,
    limit,
    totalRecords,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  return { data, pagination };
}
