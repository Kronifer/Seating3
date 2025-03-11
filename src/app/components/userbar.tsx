"use client";
import { Avatar } from "@heroui/avatar";
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

interface UserNavbarProps {
  activeIndex?: number | null;
}

export const UserNavbar = ({ activeIndex }: UserNavbarProps) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

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
    }
  }

  useEffect(() => {
    var p = getUser()!;

    p.then((json) => {
      setName(json.name.first);
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
            <Link color="foreground">My Events</Link>
          </NavbarItem>
          <NavbarItem isActive={activeIndex == 1}>
            <Link color="foreground">Joined Events</Link>
          </NavbarItem>
        </NavbarContent>
        <NavbarContent justify="end">
          {loading && (
            <Skeleton className="rounded-full">
              <Avatar />
            </Skeleton>
          )}
          {!loading && (
            <Dropdown>
              <DropdownTrigger>
                <Avatar className="cursor-pointer" name={name} />
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Static Actions"
                onAction={handleDropdown}
              >
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
        </NavbarContent>
      </HeroUINavbar>
    </>
  );
};
