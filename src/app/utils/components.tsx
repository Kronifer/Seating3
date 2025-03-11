"use client";
import { EffectCallback, FC, useEffect } from "react";
import { useRouter } from "next/navigation";

import { tokenRefresh } from "./api";

export const RefreshToken: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    tokenRefresh();
    setInterval(tokenRefresh, 60000);
  });

  return <>{children}</>;
};

export const StrictNoAuth: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();

  useEffect(() => {
    let strtime = localStorage.getItem("expireAt");

    if (strtime == null) {
      return;
    }
    let time = parseInt(strtime);

    if (time < Date.now() / 1000) {
      localStorage.removeItem("token");
      localStorage.removeItem("expireAt");

      return;
    }
    if (localStorage.getItem("token") !== null) {
      location.href = "/";
    }
  });

  return <>{children}</>;
};

export const UseAuth: FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("token") !== null) {
      let strTime: string | null = localStorage.getItem("expireAt");

      if (strTime === null) {
        location.href = "/";
      }
      let time = parseInt(strTime!);

      if (time < Date.now() / 1000) {
        localStorage.removeItem("token");
        localStorage.removeItem("expireAt");
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  });

  return <>{children}</>;
};

export const useEffectOnce = (func: EffectCallback) => {
  useEffect(func, []);
};
