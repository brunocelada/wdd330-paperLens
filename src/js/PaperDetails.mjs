import { getLocalStorage, setLocalStorage, qs, alertMessage } from "./utils";
import { reconstructAbstract, getCrossrefWork } from "./ExternalServices.mjs";
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
        this.addToHistory();
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

    addToHistory() {
        let historyPapers = getLocalStorage("paperlens-history") || [];
        // Remove the paper if it already exists in History
        historyPapers = historyPapers.filter((paper) => paper.id !== this.paper.id,);

        const paperToHistory = {
            id: this.paper.id,
            doi: this.paper.doi,
            title: this.paper.display_name,
            year: this.paper.publication_year,
            authors: this.paper.authorships?.map(
                (authorship) => authorship.author.display_name,
            ) || [],
        };
        historyPapers.push(paperToHistory);
        if (historyPapers.length > 25) {
            historyPapers.shift();
        }
        setLocalStorage("paperlens-history", historyPapers);
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
            alertMessage("This paper is already saved.");
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
        setLocalStorage("paperlens-saved", savedPapers);
        updatePaperCount();
        qs("#save-paper-button").textContent = "Saved";
        qs("#save-paper-button").style.opacity = 0.6;

        alertMessage("Paper saved.");
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
            alertMessage("This paper does not have a DOI.");
            return;
        }
        await navigator.clipboard.writeText(doi);

        alertMessage("DOI copied to clipboard.");
    }

    async copyCitation() {
        const citation = createCitation(this.paper);
        await navigator.clipboard.writeText(citation);

        alertMessage("Citation copied to clipboard.");
    }
}

function paperDetailsTemplate(paper) {
    // console.log(paper);
    qs("#paper-title").textContent = paper.display_name || "Untitled paper";
    const doi = qs("#paper-doi");
    const doiMetaData = paper.doi
        ? paper.doi.replace("https://doi.org/", "")
        : "Not available";
    doi.textContent = doiMetaData;
    doi.href = paper.doi || "";
    qs("#paper-year").textContent = paper.publication_year || "Unknown";
    const paperAccess = qs("#paper-access");
    paperAccess.textContent = paper.open_access?.is_oa
        ? "Open Access"
        : "Private Access";
    paperAccess.href = paper.open_access?.is_oa
        ? paper.best_oa_location?.pdf_url ||
        paper.best_oa_location?.landing_page_url ||
        paper.doi ||
        ""
        : paper.doi || "";
    paperAccess.classList.add(paper.open_access?.is_oa
        ? "open-access-paper"
        : "private-access-paper");
    qs("#paper-abstract").textContent = reconstructAbstract(paper.abstract_inverted_index,);

    renderAuthors(paper);
    renderTopics(paper);
    renderReferences(paper);

    qs("#paper-general-field").textContent = paper.primary_topic.domain.display_name;
    qs("#paper-cited").textContent = paper.cited_by_count ?? 0;
    qs("#paper-cite").textContent = createCitation(paper);

    setupAdditionalDetails(paper.doi);
}

function crossrefDetailsTemplate(crossref) {
    if (!crossref) {
        return `<p>Additional Crossref information is not available.</p>`;
    }
    const journal = crossref["container-title"]?.[0] || "Not available";
    const issn = crossref.ISSN?.join(", ") || "Not available";
    const published = crossref.published?.["date-parts"]?.[0];
    const publishedDate = published
        ? published.join("-")
        : "Not available";

    const references = crossref.reference
        ? crossref.reference.length
        : "Not available";
    const authorsWithOrcid = crossref.author?.filter((author) => author.ORCID) || [];
    const orcids = authorsWithOrcid.length > 0
        ? authorsWithOrcid
            .map((author) => `${author.given || ""} ${author.family || ""}:
                <a href="${author.ORCID}" target="_blank" rel="noopener noreferrer">${author.ORCID}</a>`,)
            .join("<br>")
        : "Not available";

    const funding = crossref.funder?.length > 0
        ? crossref.funder
            .map((funder) => funder.name)
            .join("<br>")
        : "Not available";

    const licenses = crossref.license?.length > 0
        ? crossref.license
            .map((license) => license.URL)
            .join("<br>")
        : "Not available";

    return `
        <dl class="crossref-details-list">
            <div>
                <dt>Publisher</dt>
                <dd>${crossref.publisher || "Not available"}</dd>
            </div>
            <div>
                <dt>Journal</dt>
                <dd>${journal}</dd>
            </div>
            <div>
                <dt>ISSN</dt>
                <dd>${issn}</dd>
            </div>
            <div>
                <dt>Volume</dt>
                <dd>${crossref.volume || "Not available"}</dd>
            </div>
            <div>
                <dt>Issue</dt>
                <dd>${crossref.issue || "Not available"}</dd>
            </div>
            <div>
                <dt>Pages</dt>
                <dd>${crossref.page || "Not available"}</dd>
            </div>
            <div>
                <dt>Published</dt>
                <dd>${publishedDate}</dd>
            </div>
            <div>
                <dt>References</dt>
                <dd>${references}</dd>
            </div>
            <div>
                <dt>License</dt>
                <dd>${licenses}</dd>
            </div>
            <div>
                <dt>ORCID</dt>
                <dd>${orcids}</dd>
            </div>
            <div>
                <dt>Funding</dt>
                <dd>${funding}</dd>
            </div>
        </dl>
    `;
}

function setupAdditionalDetails(doi) {
    const overlay = qs("#additional-details-overlay");
    const card = qs("#additional-details-card");
    const openButton = qs("#additional-details-button");
    const closeButton = qs("#close-additional-details");
    const detailsContainer = qs("#crossref-details");
    if (
        !overlay ||
        !card ||
        !openButton ||
        !closeButton ||
        !detailsContainer
    ) { return; }

    let crossrefLoaded = false;
    let crossrefLoading = false;

    openButton.addEventListener("click", async () => {
        overlay.classList.add("is-open");
        if (crossrefLoaded || crossrefLoading) {
            return;
        }
        if (!doi) {
            detailsContainer.innerHTML =
                "<p>Additional Crossref information is not available.</p>";
            crossrefLoaded = true;
            return;
        }
        crossrefLoading = true;
        detailsContainer.innerHTML =
            "<p>Loading additional details...</p>";

        try {
            const crossref = await getCrossrefWork(doi);
            detailsContainer.innerHTML = crossrefDetailsTemplate(crossref);
            crossrefLoaded = true;
        } catch (error) {
            console.warn("Crossref unavailable:", error);
            detailsContainer.innerHTML =
                "<p>Additional Crossref information is not available.</p>";
        } finally {
            crossrefLoading = false;
        }
    });

    closeButton.addEventListener("click", () => {
        overlay.classList.remove("is-open");
    });
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            overlay.classList.remove("is-open");
        }
    });
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