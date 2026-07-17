import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../../services/supabase';

export function AgendaScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgenda();
  }, []);

  async function fetchAgenda() {
    try {
      setLoading(true);
      
      // Para o protótipo da Agenda, vamos misturar Tarefas de Hoje e Contas a Vencer
      // Idealmente, criaríamos uma View no SQL ou faríamos as chamadas separadas e daríamos merge no JS.
      
      const { data: tasks } = await supabase.from('tasks').select('*').eq('status', 'pending');
      const { data: bills } = await supabase.from('financial_transactions').select('*').eq('status', 'pending');
      
      const combined: any[] = [];
      if (tasks) {
        tasks.forEach(t => combined.push({ id: `t_${t.id}`, type: 'Tarefa', title: t.title, date: t.due_date || 'Hoje' }));
      }
      if (bills) {
        bills.forEach(b => combined.push({ id: `b_${b.id}`, type: 'Conta', title: `Pagar: ${b.description}`, date: b.due_date || 'Amanhã' }));
      }
      
      setItems(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agenda</Text>
        <Text style={styles.subtitle}>Seus compromissos e tarefas unificados.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000000" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.cardType}>{item.type}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>
              <Text style={styles.cardDate}>{item.date}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Agenda livre para hoje!</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  cardContent: {
    flex: 1,
  },
  cardType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0EA5E9',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  cardDate: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
  },
});
