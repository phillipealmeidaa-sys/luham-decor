// Planilha que recebe os leads do site.
// 1) Crie uma planilha no Google > Extensões > Apps Script > cole este código > Salvar.
// 2) Implantar > Nova implantação > App da Web > Executar como: eu > Quem pode acessar: Qualquer pessoa.
// 3) Copie a URL e cole em FORM_ENDPOINT no index.html.
// Grava qualquer campo que o formulário mandar; a primeira linha vira o cabeçalho.
function doPost(e) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const p = e.parameter;
  let cab = aba.getLastRow() ? aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0] : [];
  Object.keys(p).forEach(k => { if (cab.indexOf(k) < 0) { cab.push(k); aba.getRange(1, cab.length).setValue(k); } });
  aba.appendRow(cab.map(k => (p[k] || "").toString().replace(/^[=+\-@]/, "'$&")));
  return ContentService.createTextOutput("ok");
}
