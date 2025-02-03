"use client";
import { Form } from "@heroui/form";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";

export default function LoginPage() {
  return (
    <>
      <span className="text-4xl">Sign in to </span>
      <span className="text-4xl from-[#5EA2EF] to-[#0072F5] text-transparent bg-gradient-to-b bg-clip-text">
        Seating3
      </span>
      <br />
      <br />
      <Card className="w-full">
        <CardBody>
          <Form className="gap-4" validationBehavior="native">
            <Input
              isRequired
              id="username"
              label="Username"
              labelPlacement="outside"
              name="username"
              placeholder=" "
              type="text"
              validate={(value) => {
                if (value.length < 5) {
                  return "Username must be at least 5 characters long.";
                }
                (
                  document.getElementById("submit") as HTMLButtonElement
                ).disabled = true;
              }}
            />
            <Input
              isRequired
              id="password"
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
            />
            <Button
              className="w-full text-white font-semibold text-base"
              color="success"
              id="submit"
              type="submit"
            >
              Login
            </Button>
          </Form>
        </CardBody>
        <Divider />
        <CardBody>
          <div className="flex gap-2 justify-center">
            <Button
              variant="flat"
              onPress={(_) => {
                location.href = "/forgot-username";
              }}
            >
              Forgot Username?
            </Button>
            <Button
              variant="flat"
              onPress={(_) => {
                location.href = "/reset-password";
              }}
            >
              Forgot Password?
            </Button>
          </div>
        </CardBody>
        <Divider />
        <CardFooter>
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
