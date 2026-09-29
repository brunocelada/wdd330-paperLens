import { loadHeaderFooter, getLocalStorage, setLocalStorage, qs } from "./utils";
import { updatePaperCount } from "./savedPaperCount.mjs";

async function renderSavedPapers() {
  const savedPapers = getLocalStorage("paperlens-saved");
  const listUl = qs("#list-saved");
  if (!listUl) return;
  listUl.innerHTML = "";

  if (!savedPapers || savedPapers.length === 0) {
    const li = document.createElement("li")
    li.innerText = "The list of saved papers is empty.";
    listUl.appendChild(li);
    return;
  }

  const htmlItems = savedPapers.map((paper) => savedPaperTemplate(paper));
  listUl.innerHTML = htmlItems.join("");

  await addOpenRemoveListeners();
  updatePaperCount();
}

function savedPaperTemplate(paper) {
  const newPaper = `
  <li class="paper-card">
    <a href="/paper_details/?work=${paper.id.replace("https://openalex.org/", "")}">
            <div>
              <p class="paper-card-name">${paper.title}</p>
              <p class="paper-card-details">${paper.doi.replace("https://doi.org/", "")} · ${paper.year} · ${paper.authors[0]} (${paper.authors.length} authors)</p>
            </div>
    </a>
    <button class="details-item" data-id="${paper.id}">Open</button>
    <button class="remove-item" data-id="${paper.id}">Remove &#10006;</button>
  </li>`;
  return newPaper;
}

async function addOpenRemoveListeners() {
  // Remove
  const removeItems = document.querySelectorAll(".remove-item");
  removeItems.forEach((paper) => {
    paper.addEventListener("click", (event) => {
      const id = event.target.dataset.id;

      const savedPapers = getLocalStorage("paperlens-saved");

      const index = savedPapers.findIndex((paperItem) => paperItem.id === id);
      if (index !== -1) {
        savedPapers.splice(index, 1);
      }

      setLocalStorage("paperlens-saved", savedPapers);
      renderSavedPapers();

      alert("Paper removed.");
    });
  });
  // Open
  const openItems = document.querySelectorAll(".details-item");
  openItems.forEach((paper) => {
    paper.addEventListener("click", (event) => {
      const id = event.target.dataset.id.replace("https://openalex.org/", "");
      window.location.href = `/paper_details/?work=${id}`
    });
  });
}


async function init() {
  await loadHeaderFooter();
  renderSavedPapers();
}

init();
