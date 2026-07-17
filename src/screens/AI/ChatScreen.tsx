import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';

export function ChatScreen() {
  const [messages, setMessages] = useState<any[]>([
    { id: '1', role: 'system', text: 'Olá! Sou a inteligência artificial da sua casa. Como posso ajudar?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;
    
    const userMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Endpoint Python que criamos
      // Substituir localhost pelo IP da máquina quando rodando no celular
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.text, home_id: "placeholder" })
      });
      
      const data = await response.json();
      
      const aiMessage = { id: (Date.now() + 1).toString(), role: 'system', text: data.reply || 'Erro na resposta' };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'system', text: 'Desculpe, o servidor de IA está offline.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background pt-12"
    >
      <View className="px-6 mb-4">
        <Text className="text-3xl font-bold text-primary">Chat CasaOS</Text>
      </View>

      <FlatList
        className="px-6"
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className={`mb-4 p-4 rounded-2xl max-w-[85%] ${
            item.role === 'user' 
              ? 'bg-primary self-end rounded-tr-none' 
              : 'bg-surface self-start rounded-tl-none border border-gray-100'
          }`}>
            <Text className={`text-base ${item.role === 'user' ? 'text-white' : 'text-primary'}`}>
              {item.text}
            </Text>
          </View>
        )}
      />

      <View className="p-6 bg-white border-t border-gray-100 flex-row items-center">
        <TextInput
          className="flex-1 bg-surface px-4 py-3 rounded-2xl text-primary mr-3 max-h-32"
          placeholder="Pergunte sobre as compras, tarefas..."
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity 
          className="bg-primary w-12 h-12 rounded-full items-center justify-center"
          onPress={sendMessage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="text-white text-xl">→</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
