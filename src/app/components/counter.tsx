"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";

import { useGlobalCounter } from "@/components/counterContext";

interface GlobalCounter {
  state: number;
  increment: () => void;
  decrement: () => void;
}

interface CounterProps {
  innerId: string;
  maxMeals: number;
}

export const Counter = ({ innerId, maxMeals }: CounterProps) => {
  const [count, setCount] = useState(0);
  const globalCounter = useGlobalCounter() as unknown as GlobalCounter;

  if (!globalCounter) {
    throw new Error(
      "useGlobalCounter returned null. Ensure the context provider is set up correctly.",
    );
  }
  useEffect(() => {}, [globalCounter.state]);

  return (
    <div className="flex flex-row flex-none space-x-1 items-center">
      <Button
        isIconOnly
        size="sm"
        onPress={(_) => {
          if (count <= 0) {
            return;
          }
          setCount(count - 1);
          globalCounter.decrement();
          console.log(globalCounter.state);
        }}
      >
        <svg
          fill="none"
          height="800px"
          viewBox="0 0 24 24"
          width="800px"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 12L18 12"
            stroke="#FFFFFF"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Button>
      <span className="font-lg w-[2rem] flex justify-center" id={innerId}>
        {count}
      </span>
      <Button
        isIconOnly
        size="sm"
        onPress={(_) => {
          if (globalCounter.state >= maxMeals) {
            return;
          }
          setCount(count + 1);
          globalCounter.increment();
          console.log(globalCounter.state);
        }}
      >
        <svg
          fill="none"
          height="800px"
          viewBox="0 0 24 24"
          width="800px"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 6V18"
            stroke="#FFFFFF"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 12H18"
            stroke="#FFFFFF"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Button>
    </div>
  );
};
