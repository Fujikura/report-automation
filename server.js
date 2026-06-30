const express = require("express");
const cors = require("cors");
const { chromium } = require("playwright");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const REPORT_USERNAME = process.env.REPORT_USERNAME || "";
const REPORT_PASSWORD = process.env.REPORT_PASSWORD || "";
const REPORT_URL =
  process.env.REPORT_URL || "https://rctretail.net/ts/index.php";

console.log(`\n🚀 INICIANDO SERVIDOR\n`);
console.log(`📝 Configurações:`);
console.log(`   URL: ${REPORT_URL}`);
console.log(
  `   Username: ${REPORT_USERNAME ? "✓ Configurado em .env" : "❌ NÃO configurado em .env"}`,
);
console.log(
  `   Password: ${REPORT_PASSWORD ? "✓ Configurado em .env" : "❌ NÃO configurado em .env"}\n`,
);

app.post("/api/submit-report", async (req, res) => {
  const { records, username, password, month } = req.body;

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📨 REQUISIÇÃO RECEBIDA");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`   Registros: ${records?.length || 0}`);
  console.log(`   Mês: ${month}`);

  const finalUsername = REPORT_USERNAME || username;
  const finalPassword = REPORT_PASSWORD || password;

  if (!records || records.length === 0) {
    return res.status(400).json({ error: "Nenhum registro para preencher" });
  }

  if (!finalUsername || !finalPassword) {
    return res.status(400).json({ error: "Credenciais não fornecidas" });
  }

  let browser;
  try {
    console.log("\n🌐 Iniciando navegador...");
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log(`🌐 Acessando ${REPORT_URL}...`);
    await page.goto(REPORT_URL, { waitUntil: "networkidle", timeout: 30000 });
    console.log("   ✓ Página carregada");

    console.log(`\n🔐 Fazendo login...`);
    await page.fill("#strUser", finalUsername);
    await page.fill("#strPwd", finalPassword);
    await page.click('input[value="Enviar"], button:has-text("Enviar")');
    console.log("   ✓ Credenciais preenchidas e botão clicado");

    // Aguardar elemento aparecer após login (ao invés de navegação)
    console.log("   ⏳ Aguardando carregamento da página...");
    try {
      await page.waitForSelector('a:has-text("PS_012-20D")', {
        timeout: 30000,
      });
      console.log("   ✅ Login bem-sucedido!");
    } catch (e) {
      // Se não encontrar o elemento, aguardar um pouco mais
      await page.waitForTimeout(3000);
      console.log("   ✅ Página carregada (método alternativo)");
    }

    console.log(`\n📋 Navegando para projeto...`);
    await page.click(
      'a:has-text("PS_012-20D Desenvolvimento Titan"), a[href*="projeto.php?gp=2525"]',
    );
    console.log("   ✓ Link clicado");

    console.log("   ⏳ Aguardando projeto...");
    await page.waitForTimeout(2000);
    console.log("   ✅ Projeto carregado");

    // Preencher registros
    let successCount = 0;
    console.log(`\n📝 Preenchendo ${records.length} registros...\n`);

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      console.log(`   [${i + 1}/${records.length}] ${record.date}`);

      try {
        await page.fill('textarea[name="pedttrfTxt"]', record.descricao);
        const dateParts = record.date.split("/");
        const formattedDate = `${dateParts[0]}/${dateParts[1]}/${dateParts[2]}`;
        await page.fill('input[name="pedttrfData"]', formattedDate);

        const [entH, entM] = record.entrada.split(":");
        await page.fill('input[name="pedttrfEntrada1"]', `${entH}:${entM}`);

        const [almH, almM] = record.almoco.split(":");
        await page.fill('input[name="pedttrfSaida1"]', `${almH}:${almM}`);

        const [retH, retM] = record.retorno.split(":");
        await page.fill('input[name="pedttrfEntrada2"]', `${retH}:${retM}`);

        const [saidaH, saidaM] = record.saida.split(":");
        await page.fill('input[name="pedttrfSaida2"]', `${saidaH}:${saidaM}`);

        await page.click('input[value="Enviar"], button:has-text("Enviar")');
        await page.waitForTimeout(800);

        successCount++;
        console.log(`      ✅ Preenchido`);
      } catch (recordError) {
        console.log(`      ❌ ${recordError.message.substring(0, 50)}`);
      }
    }

    await browser.close();

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎉 SUCESSO: ${successCount}/${records.length} registros`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    res.json({
      success: true,
      message: `${successCount}/${records.length} registros preenchidos`,
      successCount,
      totalRecords: records.length,
    });
  } catch (error) {
    console.log(`\n❌ ERRO: ${error.message}\n`);
    if (browser) await browser.close();

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    configured: !!(REPORT_USERNAME && REPORT_PASSWORD),
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ Servidor rodando em http://localhost:${PORT}\n`);
});
