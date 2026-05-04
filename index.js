
```javascript
const Anthropic = require("@anthropic-ai/sdk");
const readline = require("readline");

const client = new Anthropic();

// Función para calcular interés compuesto
function calculateCompoundInterest(
  principal,
  rate,
  time,
  compounds = 12
) {
  // A = P(1 + r/n)^(nt)
  // P = principal
  // r = annual interest rate (as decimal)
  // n = number of times interest compounds per year
  // t = number of years
  const amount =
    principal *
    Math.pow(1 + rate / 100 / compounds, compounds * time);
  const interest = amount - principal;

  return {
    principal,
    rate,
    time,
    compounds,
    amount: parseFloat(amount.toFixed(2)),
    interest: parseFloat(interest.toFixed(2)),
  };
}

// Función para generar informe de inversión
function generateInvestmentReport(params) {
  const result = calculateCompoundInterest(
    params.principal,
    params.rate,
    params.time,
    params.compounds || 12
  );

  const report = `
=== REPORTE DE INVERSIÓN CON INTERÉS COMPUESTO ===
Capital inicial: $${result.principal.toFixed(2)}
Tasa de interés anual: ${result.rate}%
Período de inversión: ${result.time} años
Frecuencia de capitalización: ${result.compounds} veces por año
---
Capital final: $${result.amount.toFixed(2)}
Interés ganado: $${result.interest.toFixed(2)}
Retorno porcentual: ${((result.interest / result.principal) * 100).toFixed(2)}%
`;

  return report;
}

// Función para parsear entrada del usuario
function parseInvestmentParams(text) {
  const capitalMatch = text.match(
    /capital|principal|invertir|cantidad|monto[^0-9]*(\d+(?:[.,]\d+)?)/i
  );
  const tasaMatch = text.match(/tasa|interés|porcentaje[^0-9]*(\d+(?:[.,]\d+)?)/i);
  const tiempoMatch = text.match(
    /años?|tiempo|período[^0-9]*(\d+(?:[.,]\d+)?)/i
  );
  const compoundMatch = text.match(
    /compuesto|capitaliz[^0-9]*(\d+|mensual|trimestral|semestral|anual|diario)/i
  );

  const params = {};

  if (capitalMatch) {
    params.principal = parseFloat(
      capitalMatch[1].replace(",", ".")
    );
  }
  if (tasaMatch) {
    params.rate = parseFloat(tasaMatch[1].replace(",", "."));
  }
  if (tiempoMatch) {
    params.time = parseFloat(tiempoMatch[1].replace(",", "."));
  }

  if (compoundMatch) {
    const freq = compoundMatch[1].toLowerCase();
    const frequencyMap = {
      diario: 365,
      día: 365,
      semanal: 52,
      semana: 52,
      mensual: 12,
      mes: 12,
      trimestral: 4,
      trimestre: 4,
      semestral: 2,
      semestre: 2,
      anual: 1,
      año: 1,
      1: 1,
      2: 2,
      4: 4,
      12: 12,
      365: 365,
    };
    params.compounds = frequencyMap[freq] || 12;
  }

  return params;
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const conversationHistory = [];

  console.log("=== CALCULADORA DE INTERÉS COMPUESTO ===");
  console.log(
    "Puedes preguntarme sobre cálculos de inversión con interés compuesto."
  );
  console.log('Escribe "salir" para terminar.\n');

  const askQuestion = () => {
    rl.question("Tú: ", async (userInput) => {
      if (userInput.toLowerCase() === "salir") {
        console.log(
          "¡Gracias por usar la calculadora de interés compuesto!"
        );
        rl.close();
        return;
      }

      try {
        // Agregar mensaje del usuario al historial
        conversationHistory.push({
          role: "user",
          content: userInput,
        });

        // Enviar a Claude
        const response = await client.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          system: `Eres un asistente especializado en cálculos de inversión con interés compuesto. 
Tu objetivo es ayudar a los usuarios a calcular el crecimiento de sus inversiones a largo plazo.
Cuando el usuario proporcione información sobre:
- Capital inicial/principal
- Tasa de interés anual
- Período de tiempo en años
- Frecuencia de capitalización (opcional, por defecto mensual)

Responde en español y proporciona:
1. Una explicación clara del cálculo
2. El monto final de la inversión
3. El interés ganado
4. Consejos sobre cómo maximizar las inversiones a largo plazo

Si el usuario no proporciona todos los parámetros necesarios, pide que complete la información.`,
          messages: conversationHistory,
        });

        const assistantMessage =
          response.content[0].type === "text" ? response.content[0].text : "";

        // Intentar extraer parámetros de la entrada del usuario
        const params = parseInvest