import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Bom dia,</Text>
        <Text style={styles.userName}>{data.userName}</Text>
      </View>

      <Text style={styles.sectionTitle}>Hoje na casa</Text>

      {/* Cards Rápidos */}
      <View style={styles.quickCardsContainer}>
        <TouchableOpacity 
          style={styles.quickCard}
          onPress={() => navigation.navigate('Tarefas')}
        >
          <Text style={styles.quickCardValue}>{data.pendingTasks}</Text>
          <Text style={styles.quickCardLabel}>Tarefas{'\n'}pendentes</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickCard}
          onPress={() => navigation.navigate('Compras')}
        >
          <Text style={styles.quickCardValue}>{data.shoppingItems}</Text>
          <Text style={styles.quickCardLabel}>Itens de mercado{'\n'}faltando</Text>
        </TouchableOpacity>
      </View>

      {/* Finanças */}
      <Text style={[styles.sectionTitle, styles.marginTop]}>Resumo Financeiro</Text>
      <TouchableOpacity 
        style={styles.financeCard}
        onPress={() => navigation.navigate('Finanças')}
      >
        <Text style={styles.financeLabel}>Gasto do Mês</Text>
        <Text style={styles.financeValue}>R$ {data.monthExpenses.toFixed(2)}</Text>
        
        <View style={styles.financeDivider}>
          <Text style={styles.financeSubLabel}>Evelyn deve transferir:</Text>
          <Text style={styles.financeSubValue}>R$ {data.balances.memberB.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>

      {/* Alerta da IA */}
      <Text style={styles.sectionTitle}>Alerta Inteligente</Text>
      <TouchableOpacity 
        style={styles.aiAlertCard}
        onPress={() => navigation.navigate('Chat AI')}
      >
        <Text style={styles.aiAlertTitle}>🤖 CasaOS AI</Text>
        <Text style={styles.aiAlertText}>Parece que o Feijão está acabando. Deseja que eu adicione à lista do mercado?</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  greeting: {
    color: '#64748B',
    fontSize: 18,
  },
  userName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  marginTop: {
    marginTop: 16,
  },
  quickCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  quickCardValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  quickCardLabel: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 4,
  },
  financeCard: {
    backgroundColor: '#0F172A',
    padding: 24,
    borderRadius: 16,
    marginBottom: 32,
  },
  financeLabel: {
    color: '#CBD5E1',
    fontSize: 14,
  },
  financeValue: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  financeDivider: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
  },
  financeSubLabel: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  financeSubValue: {
    color: '#0EA5E9',
    fontSize: 18,
    fontWeight: 'bold',
  },
  aiAlertCard: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  aiAlertTitle: {
    color: '#0EA5E9',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aiAlertText: {
    color: '#0F172A',
    fontSize: 16,
  },
});
