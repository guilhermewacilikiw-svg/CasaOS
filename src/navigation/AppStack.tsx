import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { TasksScreen } from '../screens/Tasks/TasksScreen';
import { ShoppingListsScreen } from '../screens/Shopping/ShoppingListsScreen';
import { FinanceScreen } from '../screens/Finance/FinanceScreen';
import { ChatScreen } from '../screens/AI/ChatScreen';
import { AgendaScreen } from '../screens/Agenda/AgendaScreen';

const Tab = createBottomTabNavigator();

export function AppStack() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#000000', tabBarLabelStyle: { fontSize: 10 } }}>
      <Tab.Screen name="Início" component={DashboardScreen} />
      <Tab.Screen name="Tarefas" component={TasksScreen} />
      <Tab.Screen name="Compras" component={ShoppingListsScreen} />
      <Tab.Screen name="Finanças" component={FinanceScreen} />
      <Tab.Screen name="Agenda" component={AgendaScreen} />
      <Tab.Screen name="Chat AI" component={ChatScreen} />
    </Tab.Navigator>
  );
}
