import {
  loadHeaderFooter,
  getLocalStorage,
  setLocalStorage,
  qs,
  setClick,
} from "./utils";

async function renderHistoryPapers() {
  const historyPapers = getLocalStorage("paperlens-history");
  const listUl = qs("#list-history");
  const cleanButton = qs("#clean-history");
  if (!listUl) return;
  listUl.innerHTML = "";

  if (!historyPapers || historyPapers.length === 0) {
    const li = document.createElement("li");
    li.innerText = "The history is empty.";
    listUl.appendChild(li);
    cleanButton.style.display = "none";
    return;
  }

  const htmlItems = [...historyPapers]
    .reverse()
    .map((paper) => historyPaperTemplate(paper));
  listUl.innerHTML = htmlItems.join("");

  cleanButton.style.display = "block";
  setClick("#clean-history", cleanHistory);

  await addOpenListener();
}

function cleanHistory() {
  setLocalStorage("paperlens-history", []);
  renderHistoryPapers();
}

function historyPaperTemplate(paper) {
  const doi = paper.doi ? paper.doi.replace("https://doi.org/", "") : "No DOI";
  const newPaper = `
  <li class="paper-card">
    <a href="/paper_details/?work=${paper.id.replace("https://openalex.org/", "")}">
            <div>
              <p class="paper-card-name">${paper.title}</p>
              <p class="paper-card-details">${doi} · ${paper.year} · ${paper.authors[0]} (${paper.authors.length} authors)</p>
            </div>
    </a>
    <button class="details-item" data-id="${paper.id}">Open</button>
  </li>`;
  return newPaper;
}

async function addOpenListener() {
  // Open
  const openItems = document.querySelectorAll(".details-item");
  openItems.forEach((paper) => {
    paper.addEventListener("click", (event) => {
      const id = event.target.dataset.id
        ? event.target.dataset.id.replace("https://openalex.org/", "")
        : "";
      window.location.href = `/paper_details/?work=${id}`;
    });
  });
}

async function init() {
  await loadHeaderFooter();
  await renderHistoryPapers();
}

init();
