/**
 * Search API Service
 *
 * Service layer for course search and discovery operations
 */

import apiClient from "./client";
import { unwrapApiData } from "./client";
import { mapCourse } from "./mappers";
import type {
  SearchParams,
  SearchResponse,
  SearchSuggestionsParams,
  SearchSuggestionsResponse,
} from "./service-types";

/**
 * Search for courses with filters and pagination
 */
export async function search(params: SearchParams): Promise<SearchResponse> {
  const queryParams: Record<string, unknown> = {
    q: params.query,
    page: params.page,
    limit: params.limit,
  };

  if (params.filters?.category) {
    queryParams.category = params.filters.category;
  }
  if (params.filters?.rating) {
    queryParams.minRating = params.filters.rating;
  }
  if (params.filters?.priceRange) {
    queryParams.minPrice = params.filters.priceRange[0];
    queryParams.maxPrice = params.filters.priceRange[1];
  }

  const response = await apiClient.get("/search/courses", { params: queryParams });
  const payload = unwrapApiData<{ data?: any[]; pagination?: any }>(response.data);
  const results = (payload?.data || []).map(mapCourse);

  return {
    results,
    total: Number(payload?.pagination?.total ?? results.length),
    suggestions: results.slice(0, 5).map((course) => course.name),
  };
}

/**
 * Get search suggestions based on partial query
 */
export async function getSuggestions(
  params: SearchSuggestionsParams
): Promise<SearchSuggestionsResponse> {
  const response = await apiClient.get("/search/suggestions", {
    params: { q: params.query, limit: params.limit },
  });
  const payload = unwrapApiData<any[]>(response.data);
  const suggestions = (payload || []).map((item) =>
    typeof item === "string" ? item : String(item?.name ?? "")
  );
  return { suggestions: suggestions.filter(Boolean) };
}
