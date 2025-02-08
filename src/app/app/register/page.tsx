"use client";
import { Form } from "@heroui/form";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { useState } from "react";
import { Divider } from "@heroui/divider";

export default function RegisterPage() {
  const [formStep, setFormStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [pwd, setPwd] = useState("");

  return (
    <>
      <span className="text-4xl">Sign up for </span>
      <span className="text-4xl from-[#5EA2EF] to-[#0072F5] text-transparent bg-gradient-to-b bg-clip-text">
        Seating3
      </span>
      <br />
      <br />
      <Card className="w-1/3 inline-block">
        <CardBody>
          {formStep == 0 && (
            <Form
              className="gap-4"
              validationBehavior="native"
              onSubmit={(e) => {
                e.preventDefault();
                setFormStep((formStep) => formStep + 1);
              }}
            >
              <Input
                isRequired
                label="First Name"
                labelPlacement="outside"
                name="firstname"
                placeholder=" "
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName((firstName) => e.target.value);
                }}
              />
              <Input
                isRequired
                label="Last Name"
                labelPlacement="outside"
                name="lastname"
                placeholder=" "
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName((lastName) => e.target.value);
                }}
              />
              <Button
                className="w-full text-white font-semibold text-base"
                color="success"
                type="submit"
              >
                Next
              </Button>
            </Form>
          )}
          {formStep == 1 && (
            <Form className="gap-4" validationBehavior="native">
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
                label="Email"
                labelPlacement="outside"
                name="email"
                placeholder=" "
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail((email) => e.target.value);
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
              <div className="flex flex-row gap-2 w-full">
                <Button
                  className="w-1/2 text-white font-semibold text-base"
                  type="button"
                  variant="flat"
                  onPress={(_) => {
                    setFormStep((formStep) => formStep - 1);
                  }}
                >
                  Go Back
                </Button>
                <Button
                  className="w-1/2 text-white font-semibold text-base"
                  color="success"
                  type="submit"
                >
                  Sign Up
                </Button>
              </div>
            </Form>
          )}
        </CardBody>
        <Divider />
        <CardFooter className="justify-center">
          <p>
            Already have an account for Seating3?{" "}
            <a
              className="text-blue-500 visited:text-purple-500 font-semibold hover:underline"
              href="/login"
            >
              Login
            </a>
          </p>
        </CardFooter>
      </Card>
    </>
  );
}
