export default async function (req: Request): Promise<Response> {
  const { user_id } = await req.json();

  const OPENAI_KEY = process.env.OPENAI_PROJECT_KEY;
  if (!OPENAI_KEY) {
    return Response.json({ error: 'AI service not configured' }, { status: 500 });
  }

  // In production, fetch user's transactions from entity
  const prompt = `You are a tax deduction advisor for self-employed individuals.
Analyze common transaction patterns and identify potentially missed tax deductions.

Return an array of deductions that freelancers commonly miss:
[
  {
    "description": "Home office deduction",
    "amount": estimated_amount,
    "explanation": "If you work from home, you can deduct a portion of rent/utilities based on square footage used exclusively for business."
  }
]

Focus on: home office, vehicle mileage, phone/internet portion, professional development, health insurance premium, retirement contributions, business meals (50%), bank fees, software subscriptions.

Return JSON array only, max 5 items.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    return Response.json({ error: 'Deduction finder failed' }, { status: 500 });
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    return Response.json(JSON.parse(jsonMatch[0]));
  } catch {
    return Response.json([]);
  }
}
