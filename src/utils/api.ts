const BASE_URL = 'https://6a336a00b083ccbe02ccfade.api.base44.com';

export interface TransactionData {
  id?: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  subcategory?: string;
  merchant: string;
  date: string;
  notes?: string;
  receipt_url?: string;
  receipt_image_uri?: string;
  ai_categorized?: boolean;
  is_tax_deductible?: boolean;
}

export interface ReceiptScanResult {
  merchant: string;
  date: string;
  total_amount: number;
  tax_amount: number;
  line_items: Array<{ description: string; amount: number; quantity: number }>;
}

// Call backend function to extract receipt data via GPT-4o Vision
export const extractReceiptData = async (imageBase64: string): Promise<ReceiptScanResult> => {
  const response = await fetch(`${BASE_URL}/functions/extractReceiptData`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 }),
  });
  if (!response.ok) throw new Error('Failed to extract receipt data');
  return response.json();
};

// Call backend function to auto-categorize a transaction
export const categorizeTransaction = async (
  merchant: string,
  amount: number
): Promise<{ category: string; subcategory: string; is_deductible: boolean; confidence: number }> => {
  const response = await fetch(`${BASE_URL}/functions/categorizeTransaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchant, amount }),
  });
  if (!response.ok) throw new Error('Failed to categorize transaction');
  return response.json();
};

// Call backend function to generate tax estimate
export const generateTaxEstimate = async (
  ytdIncome: number,
  ytdExpenses: number,
  filingStatus: string,
  state: string
): Promise<{ quarterly_estimate: number; effective_rate: number; deductions: Array<{ description: string; amount: number }> }> => {
  const response = await fetch(`${BASE_URL}/functions/generateTaxEstimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ytdIncome, ytdExpenses, filingStatus, state }),
  });
  if (!response.ok) throw new Error('Failed to generate tax estimate');
  return response.json();
};

// Call backend function to find deductions
export const findDeductions = async (
  userId: string
): Promise<Array<{ description: string; amount: number; explanation: string }>> => {
  const response = await fetch(`${BASE_URL}/functions/findDeductions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!response.ok) throw new Error('Failed to find deductions');
  return response.json();
};
