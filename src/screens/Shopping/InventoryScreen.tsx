import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Estoque da Casa</Text>
        <Text style={styles.subtitle}>Sua despensa controlada automaticamente.</Text>
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
              <View style={styles.card}>
                <View style={styles.cardInfo}>
                  <Text style={styles.productName}>{item.product_name}</Text>
                  <Text style={styles.minimumThreshold}>Mínimo ideal: {item.minimum_threshold}</Text>
                </View>
                <View style={[styles.quantityBadge, isLow ? styles.badgeDanger : styles.badgeNormal]}>
                  <Text style={styles.quantityText}>{item.quantity} {item.unit}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum produto no estoque ainda.</Text>
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
  },
  cardInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  minimumThreshold: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  quantityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  badgeNormal: {
    backgroundColor: '#0F172A',
  },
  badgeDanger: {
    backgroundColor: '#EF4444',
  },
  quantityText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
  },
});
