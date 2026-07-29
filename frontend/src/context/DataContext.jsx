import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

const moduleCodes = (access) => new Set((access?.modules || []).map((module) => module.code));

export const DataProvider = ({ children }) => {
  const { isAuthenticated, access, api } = useAuth();
  const [data, setData] = useState({
    salesDashboard: null,
    salesTransactions: [],
    inventorySummary: null,
    inventoryItems: [],
    customerSummary: null,
    customers: [],
    users: [],
    apiError: null,
    isLoading: false
  });

  const refresh = async () => {
    if (!isAuthenticated || !access) return;
    setData((current) => ({ ...current, isLoading: true, apiError: null }));
    const modules = moduleCodes(access);
    const requests = [];
    const assign = {};

    if (modules.has('sales')) {
      requests.push(
        api('/dashboard/sales?date_from=2022-03-01T00:00:00Z&date_to=2022-07-01T00:00:00Z')
          .then((value) => { assign.salesDashboard = value; })
      );
      requests.push(
        api('/sales/transactions?limit=200')
          .then((value) => { assign.salesTransactions = value.items; })
      );
    }
    if (modules.has('inventory')) {
      requests.push(api('/inventory/summary').then((value) => { assign.inventorySummary = value; }));
      requests.push(api('/inventory?limit=200').then((value) => { assign.inventoryItems = value.items; }));
    }
    if (modules.has('customer_segments')) {
      requests.push(api('/customers/summary').then((value) => { assign.customerSummary = value; }));
      requests.push(api('/customers?limit=200').then((value) => { assign.customers = value.items; }));
    }
    if (modules.has('administration')) {
      requests.push(api('/users?limit=200').then((value) => { assign.users = value.items || value; }));
    }

    const results = await Promise.allSettled(requests);
    const rejected = results.find((result) => result.status === 'rejected');
    setData((current) => ({
      ...current,
      ...assign,
      isLoading: false,
      apiError: rejected ? rejected.reason.message : null
    }));
  };

  useEffect(() => {
    refresh();
  }, [isAuthenticated, access?.role]);

  return (
    <DataContext.Provider value={{ ...data, refresh }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
