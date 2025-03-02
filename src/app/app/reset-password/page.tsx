"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { InputOtp } from "@heroui/input-otp";
import { addToast } from "@heroui/toast";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  passwordReset,
  sendPasswordResetCode,
  validateCode,
} from "@/utils/api";

export default function PasswordPage() {
  const [formStep, setFormStep] = useState(0);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pwd, setPwd] = useState("");
  const [codeInvalid, setCodeInvalid] = useState(false);
  const router = useRouter();

  const checkCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    validateCode(email, code, "passwordReset").then((success) => {
      if (!success) {
        setCodeInvalid(true);
        const a = setInterval(() => {
          (
            document.querySelector(
              "input[autocomplete='one-time-code']",
            )! as HTMLInputElement
          ).reportValidity();
          if (
            (document.getElementById("code")! as HTMLDivElement).getAttribute(
              "data-invalid",
            ) === "true"
          ) {
            setCodeInvalid(false);
            clearInterval(a);
          }
        });
      } else {
        setFormStep((formStep) => formStep + 1);
      }
    });
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    passwordReset(email, code, pwd).then((success) => {
      if (!success) {
        addToast({
          color: "danger",
          title: "Something went wrong! Please try again later.",
          timeout: 1000,
        });
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        addToast({
          color: "success",
          title: "Password changed successfully!",
          timeout: 1000,
        });
        localStorage.removeItem("token");
        localStorage.removeItem("expireAt");
        setInterval(() => {
          router.push("/login");
        }, 1000);
      }
    });
  };

  return (
    <>
      <span className="text-4xl">Reset Password</span>
      <br />
      <br />
      <Card className="w-1/3 inline-block items-center">
        {formStep == 0 && (
          <Form
            className="gap-3 justify-center"
            validationBehavior="native"
            onSubmit={(e) => {
              e.preventDefault();
              sendPasswordResetCode(email);
              setFormStep((formStep) => formStep + 1);
            }}
          >
            <CardBody className="pb-0">
              <Input
                isRequired
                label="Email"
                labelPlacement="outside"
                placeholder=" "
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
              />
            </CardBody>
            <Divider />
            <CardFooter className="pt-1 items-center">
              <Button
                className="w-full text-base font-semibold text-white"
                color="success"
                type="submit"
              >
                Next
              </Button>
            </CardFooter>
          </Form>
        )}
        {formStep == 1 && (
          <Form
            className="gap-1"
            validationBehavior="native"
            onSubmit={checkCode}
          >
            <CardBody className="items-center">
              <InputOtp
                isRequired
                id="code"
                label="code"
                length={6}
                textAlign="center"
                validate={(value) => {
                  if (codeInvalid) {
                    return "Code is invalid or expired.";
                  }
                }}
                value={code}
                variant="underlined"
                onValueChange={setCode}
              />
            </CardBody>
            <Divider />
            <CardBody className="items-center">
              <p>
                Enter the code sent to{" "}
                <span className="text-blue-400">{email}</span>. Can't find it?
                Check your spam folder.
              </p>
            </CardBody>
            <Divider />
            <CardFooter className="pt-2 items-center">
              <Button
                className="w-full text-base font-semibold text-white"
                color="success"
                type="submit"
              >
                Next
              </Button>
            </CardFooter>
          </Form>
        )}
        {formStep == 2 && (
          <Form
            className="gap-1 justify-center"
            validationBehavior="native"
            onSubmit={submit}
          >
            <CardBody>
              <Input
                isRequired
                label="New Password"
                labelPlacement="outside"
                placeholder=" "
                type="password"
                validate={(value) => {
                  if (value.length < 8) {
                    return "Password must be at least 8 characters long.";
                  }
                }}
                value={pwd}
                onChange={(e) => {
                  setPwd(e.target.value);
                }}
              />
            </CardBody>
            <Divider />
            <CardFooter className="pt-2 items-center">
              <Button
                className="w-full text-base font-semibold text-white"
                color="success"
                type="submit"
              >
                Submit
              </Button>
            </CardFooter>
          </Form>
        )}
      </Card>
    </>
  );
}
