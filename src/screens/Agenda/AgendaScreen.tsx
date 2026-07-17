import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
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
      
      const combined = [];
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
    <View className="flex-1 bg-background pt-12 px-6">
      <View className="mb-8">
        <Text className="text-3xl font-bold text-primary">Agenda</Text>
        <Text className="text-secondary mt-1">Seus compromissos e tarefas unificados.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000000" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="flex-row items-center bg-surface p-4 rounded-xl mb-3 border-l-4 border-accent">
              <View className="flex-1">
                <Text className="text-xs font-bold text-accent mb-1">{item.type}</Text>
                <Text className="text-lg font-bold text-primary">{item.title}</Text>
              </View>
              <Text className="text-sm text-secondary font-medium">{item.date}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text className="text-secondary text-center mt-10">Agenda livre para hoje!</Text>
          }
        />
      )}
    </View>
  );
}
