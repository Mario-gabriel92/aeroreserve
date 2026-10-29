'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Currency = 'EUR' | 'RON' | 'USD' | 'GBP';

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (c: Currency) => void;
    formatPrice: (amountInEur: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState<Currency>('EUR');
    // Cursuri de rezervă (Fallback) în caz că API-ul pică sau e blocat de AdBlocker
    const [rates, setRates] = useState<Record<string, number>>({ EUR: 1, RON: 4.97, USD: 1.08, GBP: 0.85 });

    useEffect(() => {
        const saved = localStorage.getItem('aero_currency') as Currency;
        if (saved) setCurrencyState(saved);

        const fetchRates = async () => {
            try {
                const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=RON,USD,GBP');
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const data = await res.json();

                if (data && data.rates) {
                    setRates({ EUR: 1, ...data.rates });
                }
            } catch (err) {
                console.warn('API-ul valutar a eșuat sau a fost blocat de o extensie. Folosim cursurile de rezervă (Fallback).');
                // Nu aruncăm nicio eroare critică, aplicația va continua să funcționeze perfect cu setRates-ul inițial.
            }
        };

        fetchRates();
    }, []);

    const setCurrency = (c: Currency) => {
        setCurrencyState(c);
        localStorage.setItem('aero_currency', c);
    };

    const formatPrice = (amountInEur: number) => {
        const rate = rates[currency] || 1;
        const converted = amountInEur * rate;

        return new Intl.NumberFormat('ro-RO', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 2
        }).format(converted);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export const useCurrency = () => {
    const ctx = useContext(CurrencyContext);
    if (!ctx) throw new Error('useCurrency trebuie utilizat în interiorul CurrencyProvider');
    return ctx;
};