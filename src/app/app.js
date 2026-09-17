import { transformSources } from "../transformer/transformer.js";
import { validateResult } from "../exercises/validator.js";

const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<record xmlns="http://www.loc.gov/MARC21/slim">
  <datafield tag="200" ind1=" " ind2=" ">
    <subfield code="a">Fables</subfield>
    <subfield code="f">Jean de La Fontaine</subfield>
  </datafield>
</record>`;

const sampleXslt = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:marc="http://www.loc.gov/MARC21/slim"
  exclude-result-prefixes="marc">
  <xsl:output method="html" encoding="UTF-8"/>
  <xsl:template match="/">
    <article>
      <h2><xsl:value-of select="marc:record/marc:datafield[@tag='200']/marc:subfield[@code='a']"/></h2>
      <p><xsl:value-of select="marc:record/marc:datafield[@tag='200']/marc:subfield[@code='f']"/></p>
    </article>
  </xsl:template>
</xsl:stylesheet>`;

const xmlEditor = document.querySelector("#xml-editor");
const xsltEditor = document.querySelector("#xslt-editor");
const transformButton = document.querySelector("#transform-button");
const preview = document.querySelector("#preview");
const htmlOutput = document.querySelector("#html-output");
const errorsOutput = document.querySelector("#errors-output");
const errorSummary = document.querySelector("#error-summary");
const runStatus = document.querySelector("#run-status");
const validateExerciseButton = document.querySelector("#validate-exercise");
const exerciseInstruction = document.querySelector("#exercise-instruction");
const exerciseTitle = document.querySelector("#exercise-title");
const exerciseSelect = document.querySelector("#exercise-select");
const exerciseStatus = document.querySelector("#exercise-status");
const hintList = document.querySelector("#hint-list");
const solutionOutput = document.querySelector("#solution-output");
const modeChoice = document.querySelector("#mode-choice");
const modeToolbar = document.querySelector("#mode-toolbar");
const exerciseStrip = document.querySelector("#exercise-strip");
const workspace = document.querySelector("#workspace");
const chooseFreeModeButton = document.querySelector("#choose-free-mode");
const chooseGuidedModeButton = document.querySelector("#choose-guided-mode");
const freeModeButton = document.querySelector("#free-mode-button");
const guidedModeButton = document.querySelector("#guided-mode-button");
let currentExercise = null;
let latestHtml = "";
let guidedModeInitialized = false;

xmlEditor.value = sampleXml;
xsltEditor.value = sampleXslt;

function setError(error) {
  const message = error instanceof Error ? error.message : String(error);
  errorSummary.textContent = message;
  errorSummary.hidden = false;
  preview.srcdoc = "";
  htmlOutput.textContent = "Aucune sortie : la transformation a échoué.";
  latestHtml = "";
  errorsOutput.textContent = message;
  runStatus.textContent = "Échec";
  runStatus.className = "run-status is-error";
  const errorsTab = document.querySelector('[data-tab="errors-panel"]');
  errorsTab.click();
  errorsTab.focus();
}

function setSuccess(html) {
  errorSummary.hidden = true;
  errorsOutput.textContent = "Aucune erreur.";
  htmlOutput.textContent = html;
  latestHtml = html;
  preview.srcdoc = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;padding:1.5rem;color:#18212b}article{border-left:4px solid #d35f36;padding-left:1rem}h2{margin:.1rem 0 .4rem}</style></head><body>${html}</body></html>`;
  runStatus.textContent = "Transformé";
  runStatus.className = "run-status is-success";
}

async function loadExercise() {
  const response = await fetch(`content/exercises/${exerciseSelect.value}.json`);
  currentExercise = await response.json();
  const xmlResponse = await fetch(currentExercise.files.xml);
  const xsltResponse = await fetch(currentExercise.files.entryXslt);
  const solutionResponse = await fetch(currentExercise.solution);
  const solution = await solutionResponse.text();
  xmlEditor.value = await xmlResponse.text();
  xsltEditor.value = await xsltResponse.text();
  exerciseTitle.textContent = currentExercise.title;
  exerciseInstruction.textContent = currentExercise.instruction;
  hintList.replaceChildren(...currentExercise.hints.map((hint) => {
    const item = document.createElement("li");
    item.textContent = hint;
    return item;
  }));
  solutionOutput.textContent = solution;
  validateExerciseButton.disabled = false;
  await runTransformation();
}

function updateModeButtons(mode) {
  freeModeButton.setAttribute("aria-pressed", String(mode === "free"));
  guidedModeButton.setAttribute("aria-pressed", String(mode === "guided"));
  freeModeButton.classList.toggle("is-active", mode === "free");
  guidedModeButton.classList.toggle("is-active", mode === "guided");
}

async function enterMode(mode) {
  modeChoice.hidden = true;
  modeToolbar.hidden = false;
  workspace.hidden = false;
  exerciseStrip.hidden = mode !== "guided";
  updateModeButtons(mode);
  if (mode === "guided" && !guidedModeInitialized) {
    guidedModeInitialized = true;
    await loadExercise();
    return;
  }
  if (mode === "free") {
    await runTransformation();
  }
}

function validateExercise() {
  if (!currentExercise || !latestHtml) {
    exerciseStatus.textContent = "Transformez d'abord les sources.";
    return;
  }
  const results = validateResult(latestHtml, currentExercise.validation);
  const passed = results.every((result) => result.passed);
  exerciseStatus.textContent = passed ? "Exercice réussi." : "Résultat incorrect. Consultez les indices et modifiez la XSLT.";
  exerciseStatus.className = `exercise-status ${passed ? "is-success" : "is-error"}`;
}

async function runTransformation() {
  transformButton.disabled = true;
  runStatus.textContent = "Transformation...";
  try {
    const html = transformSources(xmlEditor.value, xsltEditor.value);
    setSuccess(html);
  } catch (error) {
    setError(error);
  } finally {
    transformButton.disabled = false;
  }
}

transformButton.addEventListener("click", runTransformation);
exerciseSelect.addEventListener("change", () => loadExercise().catch(setError));
chooseFreeModeButton.addEventListener("click", () => enterMode("free").catch(setError));
chooseGuidedModeButton.addEventListener("click", () => enterMode("guided").catch(setError));
freeModeButton.addEventListener("click", () => enterMode("free").catch(setError));
guidedModeButton.addEventListener("click", () => enterMode("guided").catch(setError));
validateExerciseButton.addEventListener("click", validateExercise);
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    runTransformation();
  }
});

for (const tab of document.querySelectorAll(".tab")) {
  tab.addEventListener("click", () => {
    for (const candidate of document.querySelectorAll(".tab")) {
      const selected = candidate === tab;
      candidate.classList.toggle("is-active", selected);
      candidate.setAttribute("aria-selected", String(selected));
    }
    for (const panel of document.querySelectorAll(".tab-panel")) {
      const visible = panel.id === tab.dataset.tab;
      panel.classList.toggle("is-visible", visible);
      panel.hidden = !visible;
    }
  });
}
