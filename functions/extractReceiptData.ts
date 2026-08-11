export default async function (req: Request): Promise<Response> {
  const { image } = await req.json();

  if (!image) {
    return Response.json({ error: 'Image is required' }, { status: 400 });
  }

  const OPENAI_KEY = process.env.OPENAI_PROJECT_KEY;
  if (!OPENAI_KEY) {
    return Response.json({ error: 'AI service not configured' }, { status: 500 });
  }

  const prompt = `Extract the following from this receipt image and return as JSON:
{
  "merchant": "business name",
  "date": "ISO date (YYYY-MM-DD)",
  "total_amount": number,
  "tax_amount": number (0 if not visible),
  "line_items": [{"description": "item name", "amount": number, "quantity": number}],
  "payment_method": "cash/card/digital if visible, otherwise null"
}
Only return the JSON object, no other text.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }
        ]}
      ],
      max_tokens: 1000,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    return Response.json({ error: 'AI extraction failed' }, { status: 500 });
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const extracted = JSON.parse(jsonMatch[0]);
    return Response.json(extracted);
  } catch {
    return Response.json({ error: 'Failed to parse receipt data' }, { status: 500 });
  }
}
