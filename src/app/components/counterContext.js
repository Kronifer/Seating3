"use client";
import {useState, createContext, useContext} from 'react';

export const CounterContext = createContext();
export const CounterProvider = ({children}) => {
    const [state, setState] = useState(0);

    const increment = () => {
        setState(state + 1);
    };

    const decrement = () => {
        setState(state - 1);
    };

    return (
        <CounterContext.Provider value={{state, increment, decrement}}>
        {children}
        </CounterContext.Provider>
    );
}

export const useGlobalCounter = () => useContext(CounterContext);
