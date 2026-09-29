import React, { createContext, useState, useEffect, useCallback } from 'react';
import Purchases, { CustomerInfo, PurchasesError } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SubscriptionContextType {
  isSubscribed: boolean;
  isPremium: boolean;
  isLoading: boolean;
  error: string | null;
  customerInfo: CustomerInfo | null;
  availablePackages: any[];
  purchasePackage: (packageId: string) => Promise<void>;
  restorePurchases: () => Promise<void>;
  isInitialized: boolean;
}

export const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const REVENUE_CAT_API_KEY = 'appl_LIceNSeKeYhere'; // Será substituído com chave real antes de publicar

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar RevenueCat
  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        setIsLoading(true);
        
        // Configurar RevenueCat
        await Purchases.configure({
          apiKey: REVENUE_CAT_API_KEY,
          appUserID: undefined, // Use default ID or set custom one
        });

        // Buscar informações do cliente
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);

        // Verificar se é premium
        const hasActiveSubscription = Object.keys(info.activeSubscriptions).length > 0;
        setIsSubscribed(hasActiveSubscription);
        setIsPremium(hasActiveSubscription);

        // Buscar pacotes disponíveis
        try {
          const offerings = await Purchases.getOfferings();
          if (offerings.current) {
            const packages = offerings.current.availablePackages;
            setAvailablePackages(packages);
          }
        } catch (err) {
          console.error('Erro ao buscar pacotes:', err);
        }

        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error('Erro ao inicializar RevenueCat:', err);
        setError((err as Error).message || 'Erro ao inicializar assinatura');
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeRevenueCat();
  }, []);

  // Listener para mudanças no status de assinatura
  useEffect(() => {
    const setupSubscriptionListener = () => {
      const customerInfoListener = (info: CustomerInfo) => {
        setCustomerInfo(info);
        const hasActiveSubscription = Object.keys(info.activeSubscriptions).length > 0;
        setIsSubscribed(hasActiveSubscription);
        setIsPremium(hasActiveSubscription);
      };

      Purchases.addCustomerInfoUpdateListener(customerInfoListener);

      return () => {
        // Cleanup listener
      };
    };

    if (isInitialized) {
      setupSubscriptionListener();
    }
  }, [isInitialized]);

  // Comprar pacote
  const purchasePackage = useCallback(async (packageId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const pkg = availablePackages.find((p) => p.identifier === packageId);
      if (!pkg) {
        throw new Error('Pacote não encontrado');
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(customerInfo);

      const hasActiveSubscription = Object.keys(customerInfo.activeSubscriptions).length > 0;
      setIsSubscribed(hasActiveSubscription);
      setIsPremium(hasActiveSubscription);

      // Salvar info localmente
      await AsyncStorage.setItem('subscription_purchased_at', new Date().toISOString());
      await AsyncStorage.setItem('subscription_active', hasActiveSubscription ? 'true' : 'false');
    } catch (err: unknown) {
      const error = err as any;
      if (error?.code === 'PurchaseCancelledError') {
        setError('Compra cancelada');
      } else if (error?.message) {
        setError(`Erro na compra: ${error.message}`);
      } else {
        setError('Erro ao processar compra');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [availablePackages]);

  // Restaurar compras
  const restorePurchases = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const customerInfo = await Purchases.restorePurchases();
      setCustomerInfo(customerInfo);

      const hasActiveSubscription = Object.keys(customerInfo.activeSubscriptions).length > 0;
      setIsSubscribed(hasActiveSubscription);
      setIsPremium(hasActiveSubscription);
    } catch (err) {
      setError((err as Error).message || 'Erro ao restaurar compras');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: SubscriptionContextType = {
    isSubscribed,
    isPremium,
    isLoading,
    error,
    customerInfo,
    availablePackages,
    purchasePackage,
    restorePurchases,
    isInitialized,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = React.useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};
