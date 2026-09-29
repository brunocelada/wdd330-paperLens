import { getLocalStorage, qs } from "./utils";

export function updatePaperCount() {
    const savedPapers = getLocalStorage("paperlens-saved") || [];

    const savedCount = qs("#saved-count");
    if (!savedCount) return;

    savedCount.textContent = savedPapers.length;
}