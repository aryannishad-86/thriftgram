'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
    id: number;
    title: string;
    price: number;
    image: string;
    size?: string;
}

interface CartContextType {
    items: CartItem[];
    isCartOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: number) => void;
    cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load cart from local storage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error('Failed to parse cart from local storage', e);
            }
        }
    }, []);

    // Save cart to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items));
    }, [items]);

    const openCart = () => setIsCartOpen(true);
    const closeCart = () => setIsCartOpen(false);

    const addToCart = (item: CartItem) => {
        setItems((prev) => [...prev, item]);
        openCart();
    };

    const removeFromCart = (itemId: number) => {
        setItems((prev) => prev.filter((item) => item.id !== itemId));
    };

    const cartTotal = items.reduce((total, item) => total + item.price, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                isCartOpen,
                openCart,
                closeCart,
                addToCart,
                removeFromCart,
                cartTotal,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
