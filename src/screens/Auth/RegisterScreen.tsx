import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../services/supabase';

export function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUpWithEmail() {
    setLoading(true);
    
    // 1. Cria o usuário na Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      Alert.alert('Erro', error.message);
    } else {
      // Nota: A tabela public.profiles idealmente seria preenchida via 
      // uma Trigger no Postgres ao criar o user na Auth,
      // ou manualmente aqui após o signUp com sucesso.
      Alert.alert('Sucesso', 'Conta criada com sucesso! Por favor, faça login.');
      navigation.navigate('Login');
    }
    
    setLoading(false);
  }

  return (
    <View className="flex-1 bg-background justify-center px-6">
      <View className="mb-10">
        <Text className="text-3xl font-bold text-primary mb-2">Criar Conta</Text>
        <Text className="text-base text-secondary">Bem-vindo(a) ao CasaOS</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium text-secondary mb-1">Nome Completo</Text>
          <TextInput
            className="w-full bg-surface px-4 py-3 rounded-xl border border-gray-200 text-primary"
            placeholder="Como você se chama?"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        </View>

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
            placeholder="Crie uma senha forte"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          className="w-full bg-primary py-4 rounded-xl items-center mt-6"
          onPress={signUpWithEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Criar Conta</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-full items-center mt-4"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-secondary font-medium">Já tem uma conta? Entrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
