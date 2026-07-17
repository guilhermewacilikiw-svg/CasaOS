import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lista de Compras</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Adicionar item..."
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddItem}
        >
          <Text style={styles.addButtonText}>+</Text>
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
              style={styles.itemCard}
              onPress={() => togglePurchaseStatus(item)}
            >
              <View style={[
                styles.checkbox,
                item.is_purchased ? styles.checkboxPurchased : styles.checkboxPending
              ]}>
                {item.is_purchased && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.itemDetails}>
                <Text style={[
                  styles.itemName,
                  item.is_purchased && styles.itemNamePurchased
                ]}>
                  {item.name}
                </Text>
                <Text style={styles.itemQuantity}>Qtd: {item.quantity}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>A lista está vazia.</Text>
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
  itemCard: {
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
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxPending: {
    borderColor: '#CBD5E1',
  },
  checkboxPurchased: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    color: '#0F172A',
  },
  itemNamePurchased: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#64748B',
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
  },
});
