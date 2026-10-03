import ExternalOpenAlexServices from "./ExternalServices.mjs";
import PaperDetails from "./PaperDetails.mjs";
import { loadHeaderFooter } from "./utils";

const params = new URLSearchParams(window.location.search);
const paperId = params.get("work");

const services = new ExternalOpenAlexServices();

const paperDetails = new PaperDetails(paperId, services);

async function init() {
  await loadHeaderFooter();
  paperDetails.init();
}

init();
