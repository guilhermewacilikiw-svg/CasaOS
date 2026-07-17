import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../services/supabase';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) Alert.alert('Erro', error.message);
    setLoading(false);
  }

  return (
    <View className="flex-1 bg-background justify-center px-6">
      <View className="mb-12">
        <Text className="text-4xl font-bold text-primary mb-2">CasaOS</Text>
        <Text className="text-lg text-secondary">Gerencie sua casa de forma inteligente.</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium text-secondary mb-1">E-mail</Text>
          <TextInput
            className="w-full bg-surface px-4 py-3 rounded-xl border border-gray-200 text-primary"
            placeholder="Digite seu e-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-secondary mb-1">Senha</Text>
          <TextInput
            className="w-full bg-surface px-4 py-3 rounded-xl border border-gray-200 text-primary"
            placeholder="Sua senha secreta"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          className="w-full bg-primary py-4 rounded-xl items-center mt-4"
          onPress={signInWithEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-full items-center mt-2"
          onPress={() => navigation.navigate('Register')}
        >
          <Text className="text-accent font-medium">Ainda não tem conta? Criar agora</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
