import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { supabase } from '../../services/supabase';

export function InventoryScreen() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
    setupRealtime();
  }, []);

  async function fetchInventory() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('product_name', { ascending: true });
        
      if (error) console.error(error);
      if (data) setInventory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function setupRealtime() {
    const subscription = supabase
      .channel('public:inventory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        fetchInventory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  return (
    <View className="flex-1 bg-background pt-12 px-6">
      <View className="mb-8">
        <Text className="text-3xl font-bold text-primary">Estoque da Casa</Text>
        <Text className="text-secondary mt-1">Sua despensa controlada automaticamente.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000000" />
      ) : (
        <FlatList
          data={inventory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isLow = Number(item.quantity) <= Number(item.minimum_threshold);
            return (
              <View className="flex-row items-center bg-surface p-4 rounded-xl mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-primary">{item.product_name}</Text>
                  <Text className="text-sm text-secondary">Mínimo ideal: {item.minimum_threshold}</Text>
                </View>
                <View className={`px-4 py-2 rounded-lg ${isLow ? 'bg-danger' : 'bg-primary'}`}>
                  <Text className="text-white font-bold">{item.quantity} {item.unit}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text className="text-secondary text-center mt-10">Nenhum produto no estoque ainda.</Text>
          }
        />
      )}
    </View>
  );
}
