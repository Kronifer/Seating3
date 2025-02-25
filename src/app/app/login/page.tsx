"use client";
import { Form } from "@heroui/form";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { addToast } from "@heroui/toast";

import { login } from "@/utils/api";

export default function LoginPage() {
  const [userName, setUserName] = useState("");
  const [pwd, setPwd] = useState("");
  const router = useRouter();

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    login(userName, pwd).then((resp) => {
      if (resp.invalid) {
        if (resp.reason === "verify") {
          addToast({
            color: "danger",
            title: "Login failed!",
            description: "Email has not been verified.",
            timeout: 1000,
          });
          setTimeout(() => {
            sessionStorage.setItem("email", resp.email!);
            location.href = "/verify-email";
          }, 2000);
        } else {
          addToast({
            color: "danger",
            title: "Login failed!",
            description: "Username or password is invalid.",
            timeout: 2000,
          });
        }
      } else {
        localStorage.setItem("token", resp.token!);
        localStorage.setItem("expireAt", resp.expiry!.toString());
        addToast({
          color: "success",
          title: "Login successful!",
          timeout: 1000,
        });
        setTimeout(() => {
          router.push("/");
        }, 1000);
      }
    });
  };

  return (
    <>
      <span className="text-4xl">Sign in to </span>
      <span className="text-4xl from-[#5EA2EF] to-[#0072F5] text-transparent bg-gradient-to-b bg-clip-text">
        Seating3
      </span>
      <br />
      <br />
      <Card className="w-1/3 inline-block">
        <CardBody>
          <Form className="gap-4" validationBehavior="native" onSubmit={submit}>
            <Input
              isRequired
              label="Username"
              labelPlacement="outside"
              name="username"
              placeholder=" "
              type="text"
              validate={(value) => {
                if (value.length < 5) {
                  return "Username must be at least 5 characters long.";
                }
              }}
              value={userName}
              onChange={(e) => {
                setUserName((userName) => e.target.value);
              }}
            />
            <Input
              isRequired
              label="Password"
              labelPlacement="outside"
              name="password"
              placeholder=" "
              type="password"
              validate={(value) => {
                if (value.length < 8) {
                  return "Password must be at least 8 characters long.";
                }
              }}
              value={pwd}
              onChange={(e) => {
                setPwd((pwd) => e.target.value);
              }}
            />
            <Button
              className="w-full text-white font-semibold text-base"
              color="success"
              type="submit"
            >
              Login
            </Button>
          </Form>
        </CardBody>
        <Divider />
        <CardBody>
          <div className="flex gap-2 justify-center w-full">
            <Button
              className="w-1/2"
              variant="flat"
              onPress={(_) => {
                router.push("/forgot-username");
              }}
            >
              Forgot Username?
            </Button>
            <Button
              className="w-1/2"
              variant="flat"
              onPress={(_) => {
                router.push("/reset-password");
              }}
            >
              Forgot Password?
            </Button>
          </div>
        </CardBody>
        <Divider />
        <CardFooter className="justify-center">
          <p>
            Don't have an account for Seating3?{" "}
            <a
              className="text-blue-500 visited:text-purple-500 font-semibold hover:underline"
              href="/register"
            >
              Sign Up
            </a>
          </p>
        </CardFooter>
      </Card>
    </>
  );
}
