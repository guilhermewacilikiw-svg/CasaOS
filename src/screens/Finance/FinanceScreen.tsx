import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../../services/supabase';

export function FinanceScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);

  // Exemplo estático de perfis para divisão (na prática viria do db)
  const [balances, setBalances] = useState({ memberA: 0, memberB: 0 }); 

  useEffect(() => {
    fetchTransactions();
    setupRealtime();
  }, []);

  async function fetchTransactions() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) console.error(error);
      if (data) {
        setTransactions(data);
        calculateDivision(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function calculateDivision(txs: any[]) {
    // Lógica simplificada de 50/50
    let total = 0;
    txs.forEach(tx => total += Number(tx.amount));
    
    // Suponha que o membro A pagou tudo até agora e o B deve 50%
    setBalances({
      memberA: total,
      memberB: total / 2
    });
  }

  function setupRealtime() {
    const subscription = supabase
      .channel('public:financial_transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_transactions' }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }

  async function handleAddTransaction() {
    if (!description || !amount) return;
    
    const { error } = await supabase.from('financial_transactions').insert([
      { description, amount: parseFloat(amount), type: 'variable', status: 'paid' }
    ]);
    
    if (error) {
      console.error(error);
    } else {
      setDescription('');
      setAmount('');
    }
  }

  return (
    <ScrollView className="flex-1 bg-background pt-12 px-6">
      <View className="mb-8">
        <Text className="text-3xl font-bold text-primary">Finanças</Text>
      </View>

      {/* Card de Divisão de Contas (Módulo 10) */}
      <View className="bg-primary p-6 rounded-2xl mb-8">
        <Text className="text-white text-lg font-bold mb-2">Divisão do Mês (50/50)</Text>
        <Text className="text-white text-3xl font-bold mb-1">R$ {balances.memberA.toFixed(2)}</Text>
        <Text className="text-gray-300 text-sm">Gasto total da casa</Text>
        
        <View className="mt-4 pt-4 border-t border-gray-700">
          <Text className="text-white text-base">Evelyn deve transferir:</Text>
          <Text className="text-accent text-xl font-bold mt-1">R$ {balances.memberB.toFixed(2)}</Text>
        </View>
      </View>

      <Text className="text-xl font-bold text-primary mb-4">Adicionar Despesa</Text>
      <View className="flex-row mb-6">
        <TextInput
          className="flex-1 bg-surface px-4 py-3 rounded-xl border border-gray-200 text-primary mr-2"
          placeholder="Ex: Luz"
          value={description}
          onChangeText={setDescription}
        />
        <TextInput
          className="w-24 bg-surface px-4 py-3 rounded-xl border border-gray-200 text-primary mr-2"
          placeholder="R$"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TouchableOpacity 
          className="bg-primary px-6 rounded-xl justify-center items-center"
          onPress={handleAddTransaction}
        >
          <Text className="text-white font-bold">+</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-xl font-bold text-primary mb-4">Histórico</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#000000" />
      ) : (
        <View className="pb-10">
          {transactions.map((item) => (
            <View key={item.id} className="flex-row justify-between items-center bg-surface p-4 rounded-xl mb-3 border-l-4 border-danger">
              <View>
                <Text className="text-lg font-bold text-primary">{item.description}</Text>
                <Text className="text-xs text-secondary">{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <Text className="text-lg font-bold text-danger">R$ {Number(item.amount).toFixed(2)}</Text>
            </View>
          ))}
          {transactions.length === 0 && (
            <Text className="text-secondary text-center mt-4">Nenhuma despesa registrada.</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}
