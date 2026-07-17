import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../services/supabase';

export function DashboardScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    pendingTasks: 0,
    shoppingItems: 0,
    monthExpenses: 0,
    balances: { memberA: 0, memberB: 0 },
    userName: 'Guilherme'
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      
      // Busca usuário
      const { data: userData } = await supabase.auth.getUser();
      const userName = userData.user?.user_metadata?.full_name?.split(' ')[0] || 'Guilherme';

      // Tarefas
      const { count: tasksCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      
      // Compras pendentes
      const { count: shoppingCount } = await supabase.from('shopping_items').select('*', { count: 'exact', head: true }).eq('is_purchased', false);
      
      // Despesas do mês
      const { data: txs } = await supabase.from('financial_transactions').select('amount');
      let totalExpense = 0;
      if (txs) {
        txs.forEach(tx => totalExpense += Number(tx.amount));
      }

      setData({
        pendingTasks: tasksCount || 0,
        shoppingItems: shoppingCount || 0,
        monthExpenses: totalExpense,
        balances: { memberA: totalExpense, memberB: totalExpense / 2 },
        userName
      });

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background pt-12 px-6">
      <View className="mb-8">
        <Text className="text-secondary text-lg">Bom dia,</Text>
        <Text className="text-4xl font-bold text-primary">{data.userName}</Text>
      </View>

      <Text className="text-xl font-bold text-primary mb-4">Hoje na casa</Text>

      {/* Cards Rápidos */}
      <View className="flex-row justify-between mb-4">
        <TouchableOpacity 
          className="bg-surface w-[48%] p-4 rounded-2xl border border-gray-100"
          onPress={() => navigation.navigate('Tarefas')}
        >
          <Text className="text-3xl font-bold text-primary">{data.pendingTasks}</Text>
          <Text className="text-secondary text-sm mt-1">Tarefas{'\n'}pendentes</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-surface w-[48%] p-4 rounded-2xl border border-gray-100"
          onPress={() => navigation.navigate('Compras')}
        >
          <Text className="text-3xl font-bold text-primary">{data.shoppingItems}</Text>
          <Text className="text-secondary text-sm mt-1">Itens de mercado{'\n'}faltando</Text>
        </TouchableOpacity>
      </View>

      {/* Finanças */}
      <Text className="text-xl font-bold text-primary mb-4 mt-4">Resumo Financeiro</Text>
      <TouchableOpacity 
        className="bg-primary p-6 rounded-2xl mb-8"
        onPress={() => navigation.navigate('Finanças')}
      >
        <Text className="text-gray-300 text-sm">Gasto do Mês</Text>
        <Text className="text-white text-3xl font-bold mb-4">R$ {data.monthExpenses.toFixed(2)}</Text>
        
        <View className="border-t border-gray-700 pt-4">
          <Text className="text-white text-sm">Evelyn deve transferir:</Text>
          <Text className="text-accent text-lg font-bold">R$ {data.balances.memberB.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>

      {/* Alerta da IA */}
      <Text className="text-xl font-bold text-primary mb-4">Alerta Inteligente</Text>
      <TouchableOpacity 
        className="bg-[#EEF2FF] p-4 rounded-2xl mb-10 border border-[#C7D2FE]"
        onPress={() => navigation.navigate('Chat AI')}
      >
        <Text className="text-accent text-sm font-bold mb-1">🤖 CasaOS AI</Text>
        <Text className="text-primary text-base">Parece que o Feijão está acabando. Deseja que eu adicione à lista do mercado?</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}
