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
import { Key, useEffect, useState } from "react";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { addToast } from "@heroui/toast";

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
    var p = getUser();

    if (p === undefined) {
      setLoading(false);
      setLoggedIn(false);

      return;
    }
    p.then((json) => {
      setName(json.name.first);
      setLoggedIn(true);
      setLoading(false);
    });
  });

  function handleDropdown(key: Key) {
    if (key == "logout") {
      localStorage.removeItem("token");
      localStorage.removeItem("expireAt");
      addToast({
        color: "success",
        title: "Successfully logged out!",
        timeout: 1000,
      });
      setTimeout(() => {
        location.href = "/";
      }, 1000);
    } else if (key == "settings") {
      location.href = "/user/settings";
    } else {
      location.href = "/user/dashboard/my-events";
    }
  }

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
          {!loading && loggedIn && (
            <Dropdown>
              <DropdownTrigger>
                <Avatar className="cursor-pointer" name={name} />
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Static Actions"
                onAction={handleDropdown}
              >
                <DropdownItem key="events">Events</DropdownItem>
                <DropdownItem key="settings">Settings</DropdownItem>
                <DropdownItem
                  key="logout"
                  className="text-danger"
                  color="danger"
                >
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          )}
          {!loading && !loggedIn && (
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
