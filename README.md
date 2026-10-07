# **PaperLens**

### Simplifying Scientific Literature

PaperLens is a responsive web application designed to help students discover and evaluate scientific papers without having to navigate large and complex scholarly databases.

The application focuses on progressive disclosure: search results present only the information needed to quickly compare papers, while the paper details page provides deeper metadata when it becomes relevant.

> **WDD 330** | Web Frontend Development II - Final Project

> **Student:** Bruno Celada

## Overview

Finding a useful scientific paper often requires navigating through a large amount of bibliographic and scholarly metadata. For students working on assignments or research projects, much of that information is unnecessary during the initial search process.

PaperLens addresses this problem by providing a focused interface for:

- Searching scientific literature (using [OpenAlex](https://openalex.org))
- Filtering and sorting results
- Reviewing essential paper metadata
- Viewing detailed paper information
- Finding open-access versions when available
- Saving papers for later reference
- Keeping a history of recently viewed papers
- Copying DOI links and formatted citations
- Accessing additional bibliographic metadata from [Crossref](https://www.crossref.org)

The interface is designed to make scientific literature easier to scan, compare, save, and cite.

## Data Sources

### [OpenAlex](https://openalex.org)

OpenAlex is the primary data source used for scholarly paper discovery.

PaperLens uses OpenAlex for:

- Search
- Filtering
- Sorting
- Paper metadata
- Authors
- Topics
- Citation counts
- Abstracts
- Open-access information
- Referenced works

The application uses OpenAlex field selection so that search requests return only the fields required by the search-results interface. Detailed paper requests use a different field set containing information required by the paper details page.

[openalex.org](https://openalex.org)

### [Crossref](https://www.crossref.org)

Crossref is used as a secondary source for DOI-based bibliographic metadata.

PaperLens requests Crossref data when the user explicitly opens the additional-details panel instead of loading it with every paper.

[crossref.org](https://www.crossref.org)
