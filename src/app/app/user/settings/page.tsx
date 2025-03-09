"use client";
import { Avatar } from "@heroui/avatar";
import { Skeleton } from "@heroui/skeleton";
import { useEffect, useState } from "react";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";

import { getUser } from "@/utils/api";

export default function UserSettingPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    getUser()!.then((data) => {
      setFirstName(data.name.first);
      setLastName(data.name.last);
      setUsername(data.username);
      setEmail(data.email);
      setLoading(false);
      console.log(data.name);
    });
  });

  return (
    <>
      <span className="text-4xl">User Settings</span>
      <br />
      <Skeleton className="rounded-full" isLoaded={!loading}>
        <Avatar name={firstName} size="lg" />
      </Skeleton>
      <br />
      <Form className="items-center gap-2">
        <Skeleton isLoaded={!loading}>
          <Input
            label="First Name"
            labelPlacement="outside"
            type="string"
            value={firstName}
            onValueChange={setFirstName}
          />
        </Skeleton>
        <Skeleton isLoaded={!loading}>
          <Input
            label="Last Name"
            labelPlacement="outside"
            type="string"
            value={lastName}
            onValueChange={setLastName}
          />
        </Skeleton>
        <Skeleton isLoaded={!loading}>
          <Input
            label="Username"
            labelPlacement="outside"
            type="string"
            value={username}
            onValueChange={setUsername}
          />
        </Skeleton>
        <Skeleton isLoaded={!loading}>
          <Input
            label="email"
            labelPlacement="outside"
            type="email"
            value={email}
            onValueChange={setEmail}
          />
        </Skeleton>
      </Form>
    </>
  );
}
