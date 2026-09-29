import { qs } from "./utils";

export default class PaperSearchList {
    constructor(selector) {
        this.container = qs(selector);
    }

    renderResults(papers) {
        if (!this.container) return;

        this.container.innerHTML = "";
        if (!papers || papers.length === 0) {
            this.renderEmpty();
            return;
        }

        papers.forEach((paper) => {
            const paperElement = this.createPaperElement(paper);

            this.container.appendChild(paperElement);
        });
    }

    createPaperElement(paper) {
        const li = document.createElement("li");
        li.classList.add("paper-card");
        const paperLink = document.createElement("a");
        const title = document.createElement("h3");

        const paperId = paper.id.split("/").pop();

        paperLink.href = `/paper_details/index.html?work=${paperId}`;
        title.textContent = paper.display_name || "Untitled paper";

        const authors = document.createElement("p");
        authors.classList.add("paper-authors");
        const authorNames = paper.authorships
            ?.map((authorship) => authorship.author?.display_name,)
            .filter(Boolean) || [];
        if (authorNames.length > 3) {
            authors.textContent = `${authorNames.slice(0, 3).join(", ")}, et al.`;
        } else {
            authors.textContent = authorNames.join(", ") || "Unknown authors";
        }

        const metadata = document.createElement("div");
        metadata.classList.add("paper-metadata");

        const year = document.createElement("p");
        year.textContent = paper.publication_year
            ? `Year: ${paper.publication_year}`
            : "Year: unknown";

        const topic = document.createElement("p");
        topic.textContent = paper.primary_topic?.display_name
            ? `Topic: ${paper.primary_topic.display_name}`
            : "Topic: unknown";

        const citations = document.createElement("p");
        citations.textContent = `Citations: ${paper.cited_by_count ?? 0}`;

        metadata.appendChild(year);
        metadata.appendChild(topic);
        metadata.appendChild(citations);
        const access = document.createElement("p");
        access.classList.add("paper-access");

        access.textContent = paper.open_access?.is_oa
            ? "Open Access"
            : "Private Access";

        paperLink.appendChild(title);
        paperLink.appendChild(authors);
        paperLink.appendChild(metadata);
        paperLink.appendChild(access);

        li.appendChild(paperLink);

        return li;
    }

    renderEmpty() {
        const message = document.createElement("p");
        message.textContent = "No papers were found for this search.";
        message.classList.add("no-results");

        this.container.appendChild(message);
    }

    renderMessage(message) {
        if (!this.container) return;
        this.container.innerHTML = "";

        const li = document.createElement("li");
        li.classList.add("no-results");
        li.textContent = message;

        this.container.appendChild(li);
    }
}