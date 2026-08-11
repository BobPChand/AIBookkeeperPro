export default async function (req: Request): Promise<Response> {
  const { ytdIncome, ytdExpenses, filingStatus, state } = await req.json();

  const OPENAI_KEY = process.env.OPENAI_PROJECT_KEY;
  if (!OPENAI_KEY) {
    return Response.json({ error: 'AI service not configured' }, { status: 500 });
  }

  const netProfit = ytdIncome - ytdExpenses;
  const selfEmploymentTax = netProfit * 0.153;
  const taxableIncome = Math.max(0, netProfit - 0.9235 * netProfit * 0.5 - 14600); // std deduction 2026 est

  const prompt = `You are a tax estimator for US self-employed individuals.
Given:
- YTD Income: $${ytdIncome}
- YTD Expenses: $${ytdExpenses}
- Net Profit: $${netProfit}
- Filing Status: ${filingStatus}
- State: ${state}

Calculate:
1. Self-employment tax (15.3% of net profit)
2. Estimated income tax based on 2026 brackets for ${filingStatus}
3. Total estimated annual tax
4. Quarterly payment (total / 4)

Return JSON only:
{
  "quarterly_estimate": number,
  "annual_estimate": number,
  "effective_rate": number (percentage as decimal),
  "self_employment_tax": number,
  "income_tax": number,
  "deductions": [{"description": "name", "amount": number}]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    return Response.json({ error: 'Tax estimate failed' }, { status: 500 });
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return Response.json(JSON.parse(jsonMatch[0]));
  } catch {
    return Response.json({ error: 'Failed to parse tax estimate' }, { status: 500 });
  }
}
