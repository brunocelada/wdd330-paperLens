import { getLocalStorage, setLocalStorage, qs } from "./utils";
import { reconstructAbstract } from "./ExternalServices.mjs";
import { updatePaperCount } from "./savedPaperCount.mjs";

export default class PaperDetails {
    constructor(paperId, dataSource) {
        this.paperId = paperId;
        this.paper = {};
        this.dataSource = dataSource;
    }

    async init() {
        this.paper = await this.dataSource.getPaperById(this.paperId);
        this.renderPaperDetails();
        this.setupEventListeners();
        this.isSaved();
    }

    renderPaperDetails() {
        paperDetailsTemplate(this.paper);
    }

    setupEventListeners() {
        qs("#more-details")
            ?.addEventListener(
                "click",
                this.toggleMoreDetails.bind(this),
            );
        qs("#save-paper-button")
            ?.addEventListener(
                "click",
                this.savePaper.bind(this),
            );
        qs("#cite-paper-button")
            ?.addEventListener(
                "click",
                this.copyCitation.bind(this),
            );
        qs("#copy-link")
            ?.addEventListener(
                "click",
                this.copyDOI.bind(this),
            );
    }

    toggleMoreDetails() {
        const details = qs(".hidden-details");
        const button = qs("#more-details");

        if (!details) return;

        const isHidden = details.style.display === "none";

        details.style.display = isHidden ? "block" : "none";
        button.textContent = isHidden
            ? "Hide details"
            : "More details";
    }

    savePaper() {
        let savedPapers = getLocalStorage("paperlens-saved") || [];
        if (this.isSaved()) {
            alert("This paper is already saved.");
            return;
        }
        const paperToSave = {
            id: this.paper.id,
            doi: this.paper.doi,
            title: this.paper.display_name,
            year: this.paper.publication_year,
            authors: this.paper.authorships?.map(
                (authorship) => authorship.author.display_name,
            ) || [],
        };
        savedPapers.push(paperToSave);
        setLocalStorage("paperlens-saved", savedPapers,);
        updatePaperCount();
        qs("#save-paper-button").textContent = "Saved";
        qs("#save-paper-button").style.opacity = 0.6;

        alert("Paper saved.");
    }

    isSaved() {
        let savedPapers = getLocalStorage("paperlens-saved") || [];
        if (!Array.isArray(savedPapers)) {
            savedPapers = [];
        }
        const alreadySaved = savedPapers.some(
            (paper) => paper.id === this.paper.id,
        );
        if (alreadySaved) {
            qs("#save-paper-button").textContent = "Saved";
            qs("#save-paper-button").style.opacity = 0.6;
            return true;
        }
    }

    async copyDOI(event) {
        event.preventDefault();
        const doi = this.paper.doi;
        if (!doi) {
            alert("This paper does not have a DOI.");
            return;
        }
        await navigator.clipboard.writeText(doi);

        alert("DOI copied to clipboard.");
    }

    async copyCitation() {
        const citation = createCitation(this.paper);
        await navigator.clipboard.writeText(citation);

        alert("Citation copied to clipboard.");
    }
}

function paperDetailsTemplate(paper) {
    // console.log(paper);
    qs("#paper-title").textContent = paper.display_name || "Untitled paper";
    const doi = qs("#paper-doi");
    doi.textContent = paper.doi.replace("https://doi.org/", "") || "Not available";
    doi.href = paper.doi || "#";
    doi.target = "_blanc";
    doi.rel = "noopener noreferrer"
    qs("#paper-year").textContent = paper.publication_year || "Unknown";
    qs("#paper-access").textContent = paper.open_access?.is_oa
        ? "Open Access"
        : "Private Access";
    qs("#paper-abstract").textContent = reconstructAbstract(paper.abstract_inverted_index,);

    renderAuthors(paper);
    renderTopics(paper);
    renderReferences(paper);

    qs("#paper-general-field").textContent = paper.primary_topic.domain.display_name;
    qs("#paper-cited").textContent = paper.cited_by_count ?? 0;
    qs("#paper-cite").textContent = createCitation(paper);
}

function renderAuthors(paper) {
    const container = qs("#paper-authors");
    if (!container) return;

    container.innerHTML = "";

    const authors = paper.authorships || [];

    if (authors.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No author information available.";
        container.appendChild(li);
        return;
    }
    authors.forEach((authorship) => {
        const li = document.createElement("li");
        li.textContent = authorship.author?.display_name || "Unknown author";

        container.appendChild(li);
    });
}

function renderTopics(paper) {
    const container = qs("#paper-topics");
    if (!container) return;

    if (paper.primary_topic) {
        const li = document.createElement("li");

        li.textContent = paper.primary_topic.display_name;
        container.appendChild(li);
    }

    const additionalTopics = paper.topics || [];
    additionalTopics.slice(1, 5).forEach((topic) => {
        const li = document.createElement("li");
        li.textContent = topic.display_name;
        container.appendChild(li);
    });
}

function renderReferences(paper) {
    const container = qs("#paper-references");
    if (!container) return;

    container.innerHTML = "";
    const references = paper.referenced_works || [];

    if (references.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No references available";
        container.appendChild(li);
        return;
    }

    references.slice(0, 5).forEach((reference) => {
        const li = document.createElement("li");
        const referencedId = reference.split("/").pop();
        li.textContent = referencedId;

        container.appendChild(li);
    });

    if (references.length > 10) {
        const li = document.createElement("li");
        li.textContent = `...and ${references.length - 10} more references.`;
        li.style.opacity = 0.8;
        container.appendChild(li);
    }
}

function createCitation(paper) {
    const authors =
        paper.authorships
            ?.map((authorship) => authorship.author?.display_name,)
            .filter(Boolean) || [];

    let authorText = "Unknown author";

    if (authors.length === 1) {
        authorText = authors[0];
    } else if (authors.length === 2) {
        authorText =
            `${authors[0]}, & ${authors[1]}`;
    } else if (authors.length > 2) {
        authorText =
            `${authors[0]}, et al.`;
    }
    const year = paper.publication_year || "n.d.";
    const title = paper.display_name || "Untitled paper";
    const doi = paper.doi || "";

    return `${authorText} (${year}). ${title}. ${doi}`;
}