import { loadHeaderFooter, setClick, qs } from "./utils";

function setupHomeSearch() {
  const searchButton = qs("#searchSubmit")
  const searchField = qs("#search-field");
  if (!searchField || !searchButton) return;

  function goToSearch() {
    const query = searchField.value.trim();
    if (!query) {
      searchField.focus();
      return;
    }
    const params = new URLSearchParams();
    params.set("q", query);
    window.location.href = `/search_results/index.html?${params.toString()}`;
  }

  // searchButton.addEventListener("click", goToSearch);
  setClick("#searchSubmit", goToSearch);

  searchField.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      goToSearch();
    }
  });
};

async function init() {
  await loadHeaderFooter();
  setupHomeSearch();
};

init();
