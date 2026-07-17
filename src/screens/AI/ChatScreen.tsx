import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

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
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Chat CasaOS</Text>
      </View>

      <FlatList
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[
            styles.messageBubble,
            item.role === 'user' ? styles.userBubble : styles.systemBubble
          ]}>
            <Text style={[
              styles.messageText,
              item.role === 'user' ? styles.userText : styles.systemText
            ]}>
              {item.text}
            </Text>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Pergunte sobre as compras, tarefas..."
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity 
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>→</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 48,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  messageBubble: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: '#0F172A',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
  },
  systemBubble: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  messageText: {
    fontSize: 16,
  },
  userText: {
    color: '#FFFFFF',
  },
  systemText: {
    color: '#0F172A',
  },
  inputContainer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    color: '#0F172A',
    marginRight: 12,
    maxHeight: 128,
  },
  sendButton: {
    backgroundColor: '#0F172A',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
});
