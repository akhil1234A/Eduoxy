/**
 * Utilitiy module for handling pagination 
 */
import { Request } from "express";

/**
 * Interface for pagination parameters
 */
interface PaginationParams {
  page: number;
  limit: number;
  searchTerm: string;
  skip: number;
}

/**
 * Interface for pagination result
 */
interface PaginationResult extends PaginationParams {
  total: number;
  totalPages: number;
}

/**
 * Extracts pagination parameters from the request query
 * @param req Express request object contains query parameters
 * @returns Pagination parameters including page, limit, searchTerm, and skip
 */

function getPaginationParams(req: Request): PaginationParams {
  const { page = "1", limit = "10", q = "" } = req.query;
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 10)); 
  const searchTerm = (q as string).trim();

  return {
    page: pageNum,
    limit: limitNum,
    searchTerm,
    skip: (pageNum - 1) * limitNum,
  };
}

/**
 * Builds pagination result with metadata
 * @param params Pagination parameters (page, limit, searchTerm, skip)
 * @param total Total number of items
 * @returns Pagination result including total and totalPages
 */
function buildPaginationResult(params: PaginationParams, total: number): PaginationResult {
  return {
    ...params,
    total,
    totalPages: Math.ceil(total / params.limit),
  };
}

export { PaginationParams, PaginationResult, getPaginationParams, buildPaginationResult };