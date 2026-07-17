import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator } from 'react-native';
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
    <View className="flex-1 bg-background pt-12 px-6">
      <View className="flex-row justify-between items-center mb-8">
        <Text className="text-3xl font-bold text-primary">Tarefas</Text>
        <TouchableOpacity onPress={() => supabase.auth.signOut()}>
          <Text className="text-danger font-medium">Sair</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row mb-6">
        <TextInput
          className="flex-1 bg-surface px-4 py-3 rounded-xl border border-gray-200 text-primary mr-2"
          placeholder="Nova tarefa..."
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
        />
        <TouchableOpacity 
          className="bg-primary px-6 rounded-xl justify-center items-center"
          onPress={handleAddTask}
        >
          <Text className="text-white font-bold">+</Text>
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
              className="flex-row items-center bg-surface p-4 rounded-xl mb-3"
              onPress={() => toggleTaskStatus(item)}
            >
              <View className={`w-6 h-6 rounded-full border-2 mr-4 items-center justify-center
                ${item.status === 'completed' ? 'bg-success border-success' : 'border-gray-300'}`}
              >
                {item.status === 'completed' && <Text className="text-white text-xs">✓</Text>}
              </View>
              <Text className={`text-lg ${item.status === 'completed' ? 'text-secondary line-through' : 'text-primary'}`}>
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text className="text-secondary text-center mt-10">Nenhuma tarefa encontrada.</Text>
          }
        />
      )}
    </View>
  );
}
