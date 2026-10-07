const baseOpenAlexURL = import.meta.env.VITE_OA_URL
const baseCrossrefURL = import.meta.env.VITE_CR_URL

export async function convertToJson(res) {
    const jsonResponse = await res.json();
    if (res.ok) {
        return jsonResponse;
    }
    if (res.status === 429) {
        const remaining = res.headers.get("X-RateLimit-Remaining");
        const reset = res.headers.get("X-RateLimit-Reset");
        throw {
            name: "rateLimitError",
            message: "API rate limit reached.",
            remaining,
            reset,
        };
    }

    throw {
        name: "servicesError",
        message: jsonResponse,
        status: res.status,
    };
}

async function fetchWithRetry(url, signal, maxRetries = 2) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (signal?.aborted) {
            throw new DOMException("Request aborted", "AbortError");
        }

        const response = await fetch(url, { signal, });

        const retryableStatues = [429, 500, 502, 503, 504];

        if (!retryableStatues.includes(response.status)) {
            return response;
        }
        if (attempt === maxRetries) {
            return response;
        }
        const delay = 1000 * 2 ** attempt;

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, delay);
            signal?.addEventListener("abort", () => {
                clearTimeout(timeout);
                reject(new DOMException(
                    "Request aborted", "AbortError",
                ));
            },
                { once: true },
            );
        });
    }
}

export default class ExternalOpenAlexServices {
    async searchWorks({
        query = "",
        domain = "",
        year = "",
        access = "",
        sort = "relevance_score:desc",
        perPage = 50,
        cursor = "*",
        signal,
    } = {}) {
        const params = new URLSearchParams();

        // Diferent fields to update API speed
        const SEARCH_WORK_FIELDS = [
            "id",
            "display_name",
            "publication_year",
            "open_access",
            "authorships",
            "primary_topic",
            "cited_by_count",
        ].join(",");

        // Search
        if (query) {
            params.set("search", query);
        }

        // Filters
        const filters = [];
        if (domain) {
            filters.push(`primary_topic.domain.id:${domain}`);
        }
        if (year) {
            filters.push(`publication_year:${year}`);
        }
        if (access === "open") {
            filters.push("open_access.is_oa:true");
        }
        if (access === "closed") {
            filters.push("open_access.is_oa:false");
        }
        if (filters.length > 0) {
            params.set("filter", filters.join(","));
        }

        // Sorting
        if (sort) {
            params.set("sort", sort);
        }

        // Pagination
        params.set("per_page", perPage);
        params.set("cursor", cursor)

        // Fields returned by OpenAlex (only needed)
        params.set("select", SEARCH_WORK_FIELDS);

        const response = await fetchWithRetry(
            `${baseOpenAlexURL}/works?${params.toString()}`,
            signal,
        );
        const data = await convertToJson(response);
        return {
            results: data.results,
            meta: data.meta,
            nextCursor: data.meta.next_cursor,
        };
    }

    async getPaperById(id) {
        const DETAIL_WORK_FIELDS = [
            "id",
            "doi",
            "display_name",
            "publication_year",
            "open_access",
            "best_oa_location",
            "authorships",
            "primary_topic",
            "topics",
            "cited_by_count",
            "abstract_inverted_index",
            "referenced_works",
        ].join(",");

        const cleanId = id
            ? id.replace("https://openalex.org/", "")
            : id;
        const response = await fetchWithRetry(`${baseOpenAlexURL}/works/${cleanId}?select=${DETAIL_WORK_FIELDS}`);
        const data = await convertToJson(response);
        return data;
    }
}

export function reconstructAbstract(invertedIndex) {
    if (!invertedIndex) {
        return "No abstract available.";
    }
    const words = [];

    Object.entries(invertedIndex).forEach(([word, positions]) => {
        positions.forEach((position) => {
            words[position] = word;
        });
    });
    return words.join(" ");
}

export async function getCrossrefWork(doi) {
    const cleanDOI = doi
        ? doi.replace("https://doi.org/", "")
        : doi;
    const response = await fetchWithRetry(`${baseCrossrefURL}/works/${cleanDOI}`);
    const data = await convertToJson(response);
    // console.log(data.message);
    return data.message;
}