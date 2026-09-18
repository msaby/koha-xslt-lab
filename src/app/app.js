import { transformSources } from "../transformer/transformer.js";
import { validateResult } from "../exercises/validator.js";
import { createXmlEditor } from "../editor/xml-editor.bundle.js";

const xmlEditor = createXmlEditor("#xml-editor", "Éditeur MARCXML", () => runTransformation());
const xsltEditor = createXmlEditor("#xslt-editor", "Éditeur XSLT", () => runTransformation());
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
const xmlExample = {
  picker: document.querySelector("#sample-picker"),
  select: document.querySelector("#sample-select"),
  status: document.querySelector("#sample-status"),
  editor: xmlEditor, loadedSource: "", loadedFilename: "", catalogLoaded: false,
  directory: "content/samples", extension: /\.xml$/i,
  listName: "des notices", itemName: "la notice", sourceName: "le XML",
  preserved: "Votre XML est conservé.",
  confirmation: "Remplacer le XML que vous avez modifié par cette notice d’exemple ?",
};
const xsltExample = {
  picker: document.querySelector("#xslt-sample-picker"),
  select: document.querySelector("#xslt-sample-select"),
  status: document.querySelector("#xslt-sample-status"),
  editor: xsltEditor, loadedSource: "", loadedFilename: "", catalogLoaded: false,
  directory: "content/xslt/samples", extension: /\.xsl$/i,
  listName: "des feuilles XSLT", itemName: "la feuille XSLT", sourceName: "la XSLT",
  preserved: "Votre XSLT est conservée.",
  confirmation: "Remplacer la XSLT que vous avez modifiée par cette feuille d’exemple ?",
};
let modeVersion = 0;
let currentExercise = null;
let latestHtml = "";
let guidedModeInitialized = false;
let freeModeInitialized = false;
const xsltSampleToggle = document.querySelector("#xslt-sample-toggle");
const xsltSampleOptions = document.querySelector("#xslt-sample-options");
const xsltSampleDescription = document.querySelector("#xslt-sample-description");
let xsltDescriptions = {};
let xsltOptionButtons = [];

function closeXsltMenu() {
  xsltSampleOptions.hidden = true;
  xsltSampleToggle.setAttribute("aria-expanded", "false");
}

function updateXsltSelection() {
  const filename = xsltExample.loadedFilename;
  xsltSampleToggle.textContent = filename ? filename.replace(/\.xsl$/i, "") : "Choisir une feuille XSLT…";
  xsltSampleDescription.textContent = xsltDescriptions[filename] || "";
  for (const button of xsltOptionButtons) {
    button.setAttribute("aria-current", String(button.value === filename));
  }
}

function renderXsltOptions(filenames) {
  xsltOptionButtons = [];
  const items = filenames.map((filename) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sample-option";
    button.value = filename;
    const name = document.createElement("strong");
    name.textContent = filename.replace(/\.xsl$/i, "");
    const description = document.createElement("span");
    description.textContent = xsltDescriptions[filename];
    button.append(name, description);
    button.addEventListener("click", () => {
      if (xsltExample.select.disabled) return;
      xsltExample.select.value = filename;
      closeXsltMenu();
      xsltSampleToggle.focus();
      return loadSample(xsltExample);
    });
    item.append(button);
    xsltOptionButtons.push(button);
    return item;
  });
  xsltSampleOptions.replaceChildren(...items);
  xsltSampleToggle.disabled = false;
  updateXsltSelection();
}


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
  xmlExample.loadedSource = xmlEditor.value;
  xmlExample.loadedFilename = "";
  xmlExample.select.value = "";
  xsltEditor.value = await xsltResponse.text();
  xsltExample.loadedSource = xsltEditor.value;
  xsltExample.loadedFilename = "";
  xsltExample.select.value = "";
  updateXsltSelection();
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
  modeVersion += 1;
  closeXsltMenu();
  const enteredModeVersion = modeVersion;
  xmlExample.picker.hidden = mode !== "free";
  xsltExample.picker.hidden = mode !== "free";
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
    await Promise.all([xmlExample, xsltExample].map((example) =>
      example.catalogLoaded ? undefined : loadSampleCatalog(example)
    ));
    if (enteredModeVersion !== modeVersion) return;
    if (!freeModeInitialized) {
      if (!xmlExample.catalogLoaded || !xsltExample.catalogLoaded) return;
      const firstNotice = xmlExample.select.options[1]?.value;
      if (!firstNotice) {
        xmlExample.status.textContent = "Aucune notice d’exemple disponible.";
        return;
      }
      xmlExample.select.value = firstNotice;
      xsltExample.select.value = "identite.xsl";
      await Promise.all([loadSample(xmlExample), loadSample(xsltExample)]);
      if (enteredModeVersion !== modeVersion) return;
      freeModeInitialized = true;
    }
    if (!xmlEditor.value || !xsltEditor.value) return;
    await runTransformation();
  }
}

async function loadSampleCatalog(example = xmlExample) {
  const { select: sampleSelect, status: sampleStatus } = example;
  sampleSelect.disabled = true;
  sampleStatus.textContent = `Chargement de la liste ${example.listName}…`;
  try {
    const response = await fetch(`${example.directory}/index.json`);
    if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
    const filenames = await response.json();
    if (example === xsltExample) {
      const descriptionsResponse = await fetch(`${example.directory}/descriptions.json`);
      if (!descriptionsResponse.ok) throw new Error(`Erreur HTTP ${descriptionsResponse.status}`);
      xsltDescriptions = await descriptionsResponse.json();
      renderXsltOptions(filenames);
    }
    const options = filenames.map((filename) => {
      const option = document.createElement("option");
      option.value = filename;
      option.textContent = filename.replace(example.extension, "");
      return option;
    });
    sampleSelect.replaceChildren(sampleSelect.options[0], ...options);
    example.catalogLoaded = true;
    sampleSelect.disabled = false;
    sampleStatus.textContent = "";
  } catch (error) {
    sampleStatus.textContent = `Impossible de charger la liste ${example.listName} : ${error.message}. Vous pouvez toujours saisir ou coller ${example.sourceName}.`;
  }
}

async function loadSample(example = xmlExample) {
  const { select: sampleSelect, status: sampleStatus, editor } = example;
  const filename = sampleSelect.value;
  if (!filename) {
    sampleSelect.value = example.loadedFilename;
    return;
  }
  const requestModeVersion = modeVersion;
  sampleSelect.disabled = true;
  if (example === xsltExample) xsltSampleToggle.setAttribute("aria-disabled", "true");
  sampleStatus.textContent = `Chargement de ${example.itemName}…`;
  try {
    const response = await fetch(`${example.directory}/${encodeURIComponent(filename)}`);
    if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
    const source = await response.text();
    if (requestModeVersion !== modeVersion) return;
    if (editor.value !== example.loadedSource && !window.confirm(example.confirmation)) {
      sampleStatus.textContent = `Chargement annulé. ${example.preserved}`;
      return;
    }
    editor.value = source;
    example.loadedSource = editor.value;
    example.loadedFilename = filename;
    latestHtml = "";
    preview.srcdoc = "";
    htmlOutput.textContent = "Cliquez sur Transformer pour afficher le résultat.";
    errorsOutput.textContent = "Aucune erreur.";
    errorSummary.hidden = true;
    runStatus.textContent = "À transformer";
    runStatus.className = "run-status";
    sampleStatus.textContent = "";
  } catch (error) {
    if (requestModeVersion === modeVersion) {
      sampleStatus.textContent = `Impossible de charger ${example.itemName} : ${error.message}. ${example.preserved}`;
    }
  } finally {
    if (requestModeVersion !== modeVersion) sampleStatus.textContent = "";
    sampleSelect.value = example.loadedFilename;
    sampleSelect.disabled = false;
    if (example === xsltExample) {
      xsltSampleToggle.setAttribute("aria-disabled", "false");
      updateXsltSelection();
    }
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
xsltSampleToggle.addEventListener("click", () => {
  if (xsltExample.select.disabled) return;
  const open = xsltSampleOptions.hidden;
  xsltSampleOptions.hidden = !open;
  xsltSampleToggle.setAttribute("aria-expanded", String(open));
});
xsltExample.picker.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !xsltSampleOptions.hidden) {
    event.preventDefault();
    closeXsltMenu();
    xsltSampleToggle.focus();
  }
});
document.addEventListener("click", (event) => {
  if (!xsltExample.picker.contains(event.target)) closeXsltMenu();
});
xsltExample.picker.addEventListener("focusout", (event) => {
  if (!xsltExample.picker.contains(event.relatedTarget)) closeXsltMenu();
});
for (const example of [xmlExample, xsltExample]) {
  example.select.addEventListener("change", () => loadSample(example));
}
exerciseSelect.addEventListener("change", () => loadExercise().catch(setError));
chooseFreeModeButton.addEventListener("click", () => enterMode("free").catch(setError));
chooseGuidedModeButton.addEventListener("click", () => enterMode("guided").catch(setError));
freeModeButton.addEventListener("click", () => enterMode("free").catch(setError));
guidedModeButton.addEventListener("click", () => enterMode("guided").catch(setError));
validateExerciseButton.addEventListener("click", validateExercise);
document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented) return;
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
