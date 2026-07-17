import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Finanças</Text>
      </View>

      {/* Card de Divisão de Contas (Módulo 10) */}
      <View style={styles.financeCard}>
        <Text style={styles.financeLabel}>Divisão do Mês (50/50)</Text>
        <Text style={styles.financeValue}>R$ {balances.memberA.toFixed(2)}</Text>
        <Text style={styles.financeSubtext}>Gasto total da casa</Text>
        
        <View style={styles.financeDivider}>
          <Text style={styles.financeSubLabel}>Evelyn deve transferir:</Text>
          <Text style={styles.financeSubValue}>R$ {balances.memberB.toFixed(2)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Adicionar Despesa</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, styles.inputDesc]}
          placeholder="Ex: Luz"
          value={description}
          onChangeText={setDescription}
        />
        <TextInput
          style={[styles.input, styles.inputAmount]}
          placeholder="R$"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddTransaction}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Histórico</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#000000" />
      ) : (
        <View style={styles.historyContainer}>
          {transactions.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View>
                <Text style={styles.historyTitle}>{item.description}</Text>
                <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.historyAmount}>R$ {Number(item.amount).toFixed(2)}</Text>
            </View>
          ))}
          {transactions.length === 0 && (
            <Text style={styles.emptyText}>Nenhuma despesa registrada.</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  financeCard: {
    backgroundColor: '#0F172A',
    padding: 24,
    borderRadius: 16,
    marginBottom: 32,
  },
  financeLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  financeValue: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  financeSubtext: {
    color: '#CBD5E1',
    fontSize: 14,
  },
  financeDivider: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
    marginTop: 16,
  },
  financeSubLabel: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  financeSubValue: {
    color: '#0EA5E9',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#0F172A',
    marginRight: 8,
  },
  inputDesc: {
    flex: 1,
  },
  inputAmount: {
    width: 96,
  },
  addButton: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
  },
  historyContainer: {
    paddingBottom: 40,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  historyDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
  },
});
