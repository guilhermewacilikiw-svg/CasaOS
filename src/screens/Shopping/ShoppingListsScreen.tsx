import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { supabase } from '../../services/supabase';

export function ShoppingListsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
    setupRealtime();
  }, []);

  async function fetchItems() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) console.error(error);
      if (data) setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function setupRealtime() {
    const subscription = supabase
      .channel('public:shopping_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items' }, () => {
        fetchItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  async function handleAddItem() {
    if (!newItemName.trim()) return;
    
    // Inserindo sem list_id por simplicidade nessa etapa do protótipo
    const { error } = await supabase.from('shopping_items').insert([
      { name: newItemName, is_purchased: false, quantity: 1 }
    ]);
    
    if (error) {
      console.error(error);
    } else {
      setNewItemName('');
    }
  }

  async function togglePurchaseStatus(item: any) {
    const newStatus = !item.is_purchased;
    const { error } = await supabase.from('shopping_items').update({ is_purchased: newStatus }).eq('id', item.id);
    
    // Atualização automática de estoque (Regra 4.3)
    if (!error && newStatus === true) {
      // Quando comprado, adicione ao estoque (Lógica simplificada)
      const { data: existingStock } = await supabase.from('inventory').select('*').eq('product_name', item.name).single();
      if (existingStock) {
        await supabase.from('inventory').update({ quantity: Number(existingStock.quantity) + Number(item.quantity) }).eq('id', existingStock.id);
      } else {
        await supabase.from('inventory').insert([{ product_name: item.name, quantity: item.quantity, unit: 'unidades' }]);
      }
    }
  }

  return (
    <View className="flex-1 bg-background pt-12 px-6">
      <View className="mb-8">
        <Text className="text-3xl font-bold text-primary">Lista de Compras</Text>
      </View>

      <View className="flex-row mb-6">
        <TextInput
          className="flex-1 bg-surface px-4 py-3 rounded-xl border border-gray-200 text-primary mr-2"
          placeholder="Adicionar item..."
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <TouchableOpacity 
          className="bg-primary px-6 rounded-xl justify-center items-center"
          onPress={handleAddItem}
        >
          <Text className="text-white font-bold">+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000000" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              className="flex-row items-center bg-surface p-4 rounded-xl mb-3"
              onPress={() => togglePurchaseStatus(item)}
            >
              <View className={`w-6 h-6 rounded-md border-2 mr-4 items-center justify-center
                ${item.is_purchased ? 'bg-success border-success' : 'border-gray-300'}`}
              >
                {item.is_purchased && <Text className="text-white text-xs">✓</Text>}
              </View>
              <View className="flex-1">
                <Text className={`text-lg ${item.is_purchased ? 'text-secondary line-through' : 'text-primary'}`}>
                  {item.name}
                </Text>
                <Text className="text-sm text-secondary">Qtd: {item.quantity}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text className="text-secondary text-center mt-10">A lista está vazia.</Text>
          }
        />
      )}
    </View>
  );
}
