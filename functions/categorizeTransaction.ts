export default async function (req: Request): Promise<Response> {
  const { merchant, amount } = await req.json();

  if (!merchant) {
    return Response.json({ error: 'Merchant is required' }, { status: 400 });
  }

  const OPENAI_KEY = process.env.OPENAI_PROJECT_KEY;
  if (!OPENAI_KEY) {
    return Response.json({ error: 'AI service not configured' }, { status: 500 });
  }

  const categories = [
    'advertising', 'car_truck', 'commissions', 'contract_labor', 'depletion',
    'depreciation', 'employee_benefits', 'insurance', 'interest',
    'legal_professional', 'office_expense', 'pension_retirement',
    'rent_lease', 'repairs', 'supplies', 'taxes_licenses', 'travel',
    'utilities', 'wages', 'other'
  ];

  const prompt = `Based on the merchant name "${merchant}" and amount $${amount}, suggest the most appropriate IRS Schedule C expense category from this list: ${categories.join(', ')}.

Return JSON only:
{
  "category": "category_id from list",
  "subcategory": "brief subcategory description",
  "is_deductible": true/false,
  "confidence": 0.0-1.0
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
      max_tokens: 200,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    return Response.json({ error: 'Categorization failed' }, { status: 500 });
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return Response.json(JSON.parse(jsonMatch[0]));
  } catch {
    return Response.json({ category: 'other', subcategory: '', is_deductible: false, confidence: 0 });
  }
}
