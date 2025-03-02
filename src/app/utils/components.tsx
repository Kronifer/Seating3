"use client";
import { FC, useEffect } from "react";

import { tokenRefresh } from "./api";

export const RefreshToken: FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    setInterval(tokenRefresh, 60000);
  });

  return <>{children}</>;
};
