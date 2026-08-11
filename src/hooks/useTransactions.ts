import { useState, useCallback } from 'react';
import { read_entities, create_entity, update_entity, delete_entity } from '../utils/entityApi';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  merchant: string;
  date: string;
  notes?: string;
  receipt_url?: string;
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (limit = 500) => {
    setLoading(true);
    try {
      const data = await read_entities('Transaction', { limit, sort: '-date' });
      setTransactions(data);
    } catch (e) {
      console.warn('Failed to load transactions:', e);
    }
    setLoading(false);
  }, []);

  const add = useCallback(async (tx: Omit<Transaction, 'id'>) => {
    const created = await create_entity('Transaction', tx);
    setTransactions((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, data: Partial<Transaction>) => {
    const updated = await update_entity('Transaction', id, data);
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await delete_entity('Transaction', id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { transactions, loading, load, add, update, remove };
};
