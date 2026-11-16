import React, { useState } from 'react';
import { Download, Moon, Plus, RotateCcw, Sun, Trash2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { AccountType } from '../types/finance';
import { exportTransactionsToCSV, formatINR } from '../utils/formatters';

export function SettingsView() {
  const {
    accounts,
    transactions,
    settings,
    updateSettings,
    addAccount,
    updateAccount,
    deleteAccount,
    resetDemoData,
    clearAllData,
  } = useFinance();

  const [showAddAcc, setShowAddAcc] = useState(false);
  const [accName, setAccName] = useState('');
  const [accInst, setAccInst] = useState('');
  const [accType, setAccType] = useState<AccountType>('bank');
  const [accBalance, setAccBalance] = useState('25000');
  const [accLastFour, setAccLastFour] = useState('1234');
  const [confirmClear, setConfirmClear] = useState(false);

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;
    addAccount({
      name: accName.trim(),
      institution: accInst.trim() || 'Indian Bank',
      type: accType,
      balance: Math.round(Number(accBalance) || 0),
      lastFour: (accLastFour || '0000').slice(0, 4),
      includeInSafeToSpend: accType === 'bank' || accType === 'upi',
    });
    setAccName('');
    setAccInst('');
    setShowAddAcc(false);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Profile & Preferences */}
      <section className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-6 space-y-5">
        <div>
          <h2 className="font-display text-base font-bold text-[#0E172A] dark:text-[#F4F3EE]">
            Profile &amp; display preferences
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            Customize your profile, INR formatting density, and Safe-to-Spend rules
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
              Display name
            </label>
            <input
              type="text"
              value={settings.userName}
              onChange={(e) => updateSettings({ userName: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
              Role &amp; city
            </label>
            <input
              type="text"
              value={settings.personaLabel}
              onChange={(e) => updateSettings({ personaLabel: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
              Monthly savings reserve (INR)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={settings.monthlySavingsReserve}
              onChange={(e) =>
                updateSettings({ monthlySavingsReserve: Math.max(0, Number(e.target.value) || 0) })
              }
              className="w-full px-3 py-2 text-sm font-mono-nums rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]"
            />
            <p className="mt-1 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
              Ring-fenced from your Safe-to-Spend allowance every month
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#475569] dark:text-[#94A3B8] mb-1">
              Large number format
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#F3F1EA] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]">
              <button
                type="button"
                onClick={() => updateSettings({ currencyDisplay: 'full' })}
                className={`py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                  settings.currencyDisplay === 'full'
                    ? 'bg-[#FFFFFF] dark:bg-[#192334] text-[#0E172A] dark:text-[#F4F3EE] shadow-xs'
                    : 'text-[#64748B]'
                }`}
              >
                Full (₹1,42,850)
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ currencyDisplay: 'compact' })}
                className={`py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                  settings.currencyDisplay === 'compact'
                    ? 'bg-[#FFFFFF] dark:bg-[#192334] text-[#0E172A] dark:text-[#F4F3EE] shadow-xs'
                    : 'text-[#64748B]'
                }`}
              >
                Lakhs (₹1.43L)
              </button>
            </div>
          </div>
        </div>

        {/* Theme Switch */}
        <div className="pt-4 border-t border-[#E5E2D8] dark:border-[#232B3A] flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#0E172A] dark:text-[#F4F3EE]">
              Color theme
            </p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Switch between warm Ivory Light and Midnight Navy Dark
            </p>
          </div>
          <div className="inline-flex p-1 rounded-lg bg-[#F3F1EA] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A]">
            <button
              type="button"
              onClick={() => updateSettings({ theme: 'light' })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                settings.theme === 'light'
                  ? 'bg-[#FFFFFF] text-[#0E172A] shadow-xs'
                  : 'text-[#64748B]'
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
              <span>Ivory Light</span>
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ theme: 'dark' })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                settings.theme === 'dark'
                  ? 'bg-[#192334] text-[#F4F3EE] shadow-xs'
                  : 'text-[#64748B]'
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
              <span>Midnight Dark</span>
            </button>
          </div>
        </div>
      </section>

      {/* Linked Accounts Manager */}
      <section className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-bold text-[#0E172A] dark:text-[#F4F3EE]">
              Accounts &amp; UPI wallets
            </h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Toggle which balances count toward your Safe-to-Spend liquidity
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddAcc((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E5E2D8] dark:border-[#232B3A] hover:bg-[#F3F1EA] dark:hover:bg-[#192334] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add account</span>
          </button>
        </div>

        {showAddAcc && (
          <form
            onSubmit={handleAddAccount}
            className="p-4 rounded-lg bg-[#FAF9F5] dark:bg-[#0B111C] border border-[#E5E2D8] dark:border-[#232B3A] grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
          >
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#64748B] mb-1">Account name</label>
              <input
                type="text"
                required
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                placeholder="e.g. SBI Savings"
                className="w-full px-3 py-1.5 text-sm rounded-lg bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Type</label>
              <select
                value={accType}
                onChange={(e) => setAccType(e.target.value as AccountType)}
                className="w-full px-2.5 py-1.5 text-sm rounded-lg bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A]"
              >
                <option value="bank">Bank</option>
                <option value="upi">UPI Wallet</option>
                <option value="card">Credit Card</option>
                <option value="investment">Investment</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Balance ₹</label>
              <input
                type="number"
                value={accBalance}
                onChange={(e) => setAccBalance(e.target.value)}
                className="w-full px-3 py-1.5 text-sm font-mono-nums rounded-lg bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-[#84CC16] dark:bg-[#A3E635] text-[#0E172A] cursor-pointer"
            >
              Add
            </button>
          </form>
        )}

        <div className="divide-y divide-[#E5E2D8] dark:divide-[#232B3A]">
          {accounts.map((acc) => (
            <div key={acc.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#0E172A] dark:text-[#F4F3EE]">
                  {acc.name}
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  {acc.institution} · •••• {acc.lastFour} · {acc.type.toUpperCase()}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-xs text-[#475569] dark:text-[#CBD5E1] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acc.includeInSafeToSpend}
                    onChange={(e) =>
                      updateAccount({ ...acc, includeInSafeToSpend: e.target.checked })
                    }
                    className="accent-[#65A30D]"
                  />
                  <span>Include in Safe-to-Spend</span>
                </label>

                <span className="font-mono-nums text-sm font-bold text-[#0E172A] dark:text-[#F4F3EE]">
                  {formatINR(acc.balance)}
                </span>

                {accounts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteAccount(acc.id)}
                    className="p-1.5 rounded-md text-[#64748B] hover:text-[#DC4C3E] cursor-pointer"
                    aria-label={`Remove ${acc.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Data Portability & Reset */}
      <section className="rounded-xl bg-[#FFFFFF] dark:bg-[#121A28] border border-[#E5E2D8] dark:border-[#232B3A] p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-bold text-[#0E172A] dark:text-[#F4F3EE]">
            Data &amp; workspace reset
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            Stored locally in your browser. Export your ledger anytime or reset sample data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => exportTransactionsToCSV(transactions, accounts)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E2D8] dark:border-[#232B3A] hover:bg-[#F3F1EA] dark:hover:bg-[#192334] cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={resetDemoData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E2D8] dark:border-[#232B3A] hover:bg-[#F3F1EA] dark:hover:bg-[#192334] cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restore sample data</span>
          </button>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="px-3.5 py-2 text-xs font-medium rounded-lg text-[#DC4C3E] dark:text-[#F07160] border border-[#E5E2D8] dark:border-[#232B3A] hover:bg-[#F3F1EA] dark:hover:bg-[#192334] cursor-pointer"
            >
              Start fresh
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                clearAllData();
                setConfirmClear(false);
              }}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#DC4C3E] text-white cursor-pointer"
            >
              Confirm clear all
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
