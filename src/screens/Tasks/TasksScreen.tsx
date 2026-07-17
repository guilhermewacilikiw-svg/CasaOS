import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../../services/supabase';

export function TasksScreen() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
    setupRealtime();
  }, []);

  async function fetchTasks() {
    try {
      setLoading(true);
      // Aqui deveríamos pegar o home_id do usuário, por simplicidade pegamos todas visíveis via RLS
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) console.error('Erro ao buscar tarefas:', error);
      if (data) setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function setupRealtime() {
    const subscription = supabase
      .channel('public:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        console.log('Realtime Update:', payload);
        fetchTasks(); // Recarrega a lista toda vez que há mudança
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  async function handleAddTask() {
    if (!newTaskTitle.trim()) return;
    
    // Por enquanto o home_id será ignorado ou gerará erro se for required no banco sem default
    // Para resolver isso no app real, primeiro criaríamos uma Home e associaríamos ao Profile
    const { error } = await supabase.from('tasks').insert([
      { title: newTaskTitle, status: 'pending' }
    ]);
    
    if (error) {
      console.error('Erro ao criar tarefa:', error);
    } else {
      setNewTaskTitle('');
    }
  }

  async function toggleTaskStatus(task: any) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tarefas</Text>
        <TouchableOpacity onPress={() => supabase.auth.signOut()}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nova tarefa..."
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddTask}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000000" />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.taskCard}
              onPress={() => toggleTaskStatus(item)}
            >
              <View style={[
                styles.checkbox,
                item.status === 'completed' ? styles.checkboxCompleted : styles.checkboxPending
              ]}>
                {item.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[
                styles.taskTitle,
                item.status === 'completed' && styles.taskTitleCompleted
              ]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhuma tarefa encontrada.</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#0F172A',
    marginRight: 8,
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
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxPending: {
    borderColor: '#CBD5E1',
  },
  checkboxCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskTitle: {
    fontSize: 18,
    color: '#0F172A',
  },
  taskTitleCompleted: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
  },
});
