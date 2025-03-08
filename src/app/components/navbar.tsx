"use client";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
} from "@heroui/navbar";
import { Skeleton } from "@heroui/skeleton";
import { useEffect, useState } from "react";

import { getUser } from "@/utils/api";

interface NavbarProps {
  activeIndex?: number | null;
}

export const Navbar = ({ activeIndex }: NavbarProps) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let token = localStorage.getItem("token");

    if (token !== null) {
      setLoggedIn(true);
    }
    getUser()?.then((json) => {
      if (json === undefined) {
        setLoggedIn(false);
      } else {
        setName(json.name);
      }
      setLoading(false);
    });
  });

  return (
    <>
      <HeroUINavbar
        classNames={{
          item: [
            "flex",
            "relative",
            "h-full",
            "items-center",
            "data-[active=true]:after:content-['']",
            "data-[active=true]:after:absolute",
            "data-[active=true]:after:bottom-0",
            "data-[active=true]:after:left-0",
            "data-[active=true]:after:right-0",
            "data-[active=true]:after:h-[2px]",
            "data-[active=true]:after:rounded-[2px]",
            "data-[active=true]:after:bg-primary",
          ],
        }}
        isBordered={true}
        maxWidth="full"
      >
        <NavbarBrand>
          <span className="from-[#5EA2EF] to-[#0072F5] text-transparent bg-gradient-to-b bg-clip-text font-semibold text-2xl">
            Seating3
          </span>
        </NavbarBrand>
        <NavbarContent justify="center">
          <NavbarItem isActive={activeIndex == 0}>
            <Link color="foreground">Home</Link>
          </NavbarItem>
          <NavbarItem isActive={activeIndex == 1}>
            <Link color="foreground">About</Link>
          </NavbarItem>
        </NavbarContent>
        <NavbarContent justify="end">
          {loading && (
            <Skeleton className="rounded-full">
              <Avatar />
            </Skeleton>
          )}
          {loggedIn && !loading && <Avatar name={name} />}
          {!loggedIn && !loading && (
            <>
              <Button
                color="default"
                onPress={() => {
                  location.href = "/login";
                }}
              >
                Log In
              </Button>
              <Button
                color="primary"
                onPress={() => {
                  location.href = "/register";
                }}
              >
                Sign Up
              </Button>
            </>
          )}
        </NavbarContent>
      </HeroUINavbar>
    </>
  );
};
