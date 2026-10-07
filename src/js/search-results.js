import { loadHeaderFooter, qs } from "./utils";
import ExternalOpenAlexServices from "./ExternalServices.mjs";
import PaperSearchList from "./PaperSearchList.mjs";

const services = new ExternalOpenAlexServices();
const paperList = new PaperSearchList("#list-results");

let searchController = null;
let searchRequestId = 0;

const searchParams = new URLSearchParams(window.location.search);

const state = {
  query: searchParams.get("q") || "",
  domain: searchParams.get("domain") || "",
  year: searchParams.get("year") || "",
  access: searchParams.get("access") || "",
  sort: searchParams.get("sort") || "relevance",
};

function initializeControls() {
  const domainFilter = qs("#domain-filter");
  const yearFilter = qs("#year-filter");
  const accessFilter = qs("#access-filter");
  const sortFilter = qs("#sort-filter");

  if (domainFilter) {
    domainFilter.value = state.domain;
  }
  if (yearFilter) {
    yearFilter.value = state.year;
  }
  if (accessFilter) {
    accessFilter.value = state.access;
  }
  if (sortFilter) {
    sortFilter.value = state.sort;
  }
}

function updateURL() {
  const params = new URLSearchParams();
  if (state.query) {
    params.set("q", state.query);
  }
  if (state.domain) {
    params.set("domain", state.domain);
  }
  if (state.year) {
    params.set("year", state.year);
  }
  if (state.access) {
    params.set("access", state.access);
  }
  if (state.sort) {
    params.set("sort", state.sort);
  }

  const newURL = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", newURL);
}

function getSortValue() {
  switch (state.sort) {
    case "newest":
      return "publication_year:desc";
    case "oldest":
      return "publication_year:asc";
    case "title-az":
      return "display_name:asc";
    case "title-za":
      return "display_name:desc";
    case "citations":
      return "cited_by_count:desc";
    case "citations-low":
      return "cited_by_count:asc";
    case "relevance":
    default:
      return state.query ? "relevance_score:desc" : "publication_year:desc";
  }
}

async function searchPapers() {
  const resultQuery = qs("#result-query");
  const totalResults = qs("#total-results");

  // Cancel the previous search, create a new controller for this
  // search and give a unique ID.
  searchController?.abort();
  searchController = new AbortController();
  const currentRequestId = ++searchRequestId;

  if (resultQuery) {
    resultQuery.textContent = state.query || "All papers";
  }

  try {
    if (totalResults) {
      totalResults.textContent = "Searching...";
    }

    const data = await services.searchWorks({
      query: state.query,
      domain: state.domain,
      year: state.year,
      access: state.access,
      sort: getSortValue(),
      perPage: 50,
      signal: searchController.signal,
    });
    if (currentRequestId !== searchRequestId) {
      return;
    }

    paperList.renderResults(data.results);

    if (totalResults) {
      totalResults.textContent = `${data.meta.count.toLocaleString()} results`;
    }
    updateURL();
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }
    if (currentRequestId !== searchRequestId) {
      return;
    }
    if (error.name === "rateLimitError") {
      if (totalResults) {
        totalResults.textContent = "OpenAlex is temporarily unavailable.";
      }
      paperList.renderMessage(
        "Too many request. Please wait a moment and try again.",
      );
      return;
    }
    // console.error("Error searching OpenAlex", error);

    if (totalResults) {
      totalResults.textContent = "Unable to load results.";
    }
    paperList.renderMessage("Something went wrong while loading the papers.");
    paperList.renderResults([]);
  }
}

function setupFilters() {
  const domainFilter = qs("#domain-filter");
  const yearFilter = qs("#year-filter");
  const accessFilter = qs("#access-filter");
  const sortFilter = qs("#sort-filter");

  domainFilter?.addEventListener("change", () => {
    state.domain = domainFilter.value;
    searchPapers();
  });
  yearFilter?.addEventListener("change", () => {
    state.year = yearFilter.value;
    searchPapers();
  });
  accessFilter?.addEventListener("change", () => {
    state.access = accessFilter.value;
    searchPapers();
  });
  sortFilter?.addEventListener("change", () => {
    state.sort = sortFilter.value;
    searchPapers();
  });
}

async function init() {
  await loadHeaderFooter();
  initializeControls();
  setupFilters();
  searchPapers();
}

init();
