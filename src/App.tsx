import React from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Layout } from './components/Layout';
import { TransactionModal } from './components/TransactionModal';
import { OverviewView } from './views/OverviewView';
import { TransactionsView } from './views/TransactionsView';
import { BudgetsView } from './views/BudgetsView';
import { GoalsView } from './views/GoalsView';
import { BillsView } from './views/BillsView';
import { InsightsView } from './views/InsightsView';
import { SettingsView } from './views/SettingsView';

function ActiveViewRouter() {
  const { activeView } = useFinance();

  switch (activeView) {
    case 'overview':
      return <OverviewView />;
    case 'transactions':
      return <TransactionsView />;
    case 'budgets':
      return <BudgetsView />;
    case 'goals':
      return <GoalsView />;
    case 'bills':
      return <BillsView />;
    case 'insights':
      return <InsightsView />;
    case 'settings':
      return <SettingsView />;
    default:
      return <OverviewView />;
  }
}

export default function App() {
  return (
    <FinanceProvider>
      <Layout>
        <ActiveViewRouter />
      </Layout>
      <TransactionModal />
    </FinanceProvider>
  );
}
