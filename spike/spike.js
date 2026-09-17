import { transform } from "../src/transformer/transformer.js";

const fixtures = [
  { name: "MARCXML avec namespace", stylesheet: "fixtures/simple.xsl" },
  { name: "xsl:include relatif", stylesheet: "fixtures/include/main.xsl" },
  { name: "xsl:import et précédence", stylesheet: "fixtures/import/main.xsl" }
];

const resultsElement = document.querySelector("#results");
const outputElement = document.querySelector("#output");
const statusElement = document.querySelector("#status");
async function run() {
  let passed = 0;
  for (const fixture of fixtures) {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const resultCell = document.createElement("td");
    const detailCell = document.createElement("td");
    nameCell.textContent = fixture.name;
    row.append(nameCell, resultCell, detailCell);
    resultsElement.append(row);
    try {
      const html = await transform(fixture.stylesheet);
      const passedOutput = html.includes("Jean de La Fontaine");
      if (!passedOutput) {
        throw new Error(`Sortie inattendue: ${html}`);
      }
      resultCell.textContent = "OK";
      resultCell.className = "pass";
      detailCell.textContent = html;
      outputElement.textContent = html;
      passed += 1;
    } catch (error) {
      resultCell.textContent = "ÉCHEC";
      resultCell.className = "fail";
      detailCell.textContent = error.message;
    }
  }
  const allPassed = passed === fixtures.length;
  statusElement.dataset.state = allPassed ? "pass" : "fail";
  statusElement.textContent = `${passed}/${fixtures.length} tests réussis${allPassed ? "." : ". Consulter les détails ci-dessous."}`;
}

run().catch((error) => {
  statusElement.dataset.state = "fail";
  statusElement.textContent = `Erreur du spike : ${error.message}`;
});