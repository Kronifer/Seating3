"use client";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { InputOtp } from "@heroui/input-otp";
import { Form } from "@heroui/form";
import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { addToast } from "@heroui/toast";

import { verifyEmail } from "@/utils/api";

export default function VerifyPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeInvalid, setCodeInvalid] = useState(false);
  const router = useRouter();

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(code);
    verifyEmail(email, code).then((resp) => {
      if (resp.invalid) {
        const a = setInterval(() => {
          setCodeInvalid(true);
          (
            document.querySelector(
              "input[autocomplete='one-time-code']",
            )! as HTMLInputElement
          ).reportValidity();
          if (
            (document.getElementById("code")! as HTMLDivElement).getAttribute(
              "data-invalid",
            ) == "true"
          ) {
            setCodeInvalid(false);
            clearInterval(a);
          }
        });
      } else {
        addToast({
          color: "success",
          title: "Verification Successful!",
          timeout: 1000,
        });
        setTimeout(() => {
          router.push("/login");
        }, 1000);
      }
    });
  };

  useEffect(() => {
    setEmail(
      sessionStorage.getItem("email") ? sessionStorage.getItem("email")! : "",
    );
    if (
      document.referrer != location.origin + "/register" &&
      document.referrer != location.origin + "/login"
    ) {
      router.push("/");
    }
  });

  return (
    <>
      <span className="text-4xl">Verify your email to continue</span>
      <br />
      <br />
      <Card className="w-3/4 items-center inline-block">
        <Form
          className="items-center"
          validationBehavior="native"
          onSubmit={submit}
        >
          <CardBody className="items-center">
            <InputOtp
              isRequired
              id="code"
              label="Code"
              length={6}
              name="code"
              textAlign="center"
              validate={(value) => {
                if (codeInvalid) {
                  return "Code is invalid or has expired.";
                }
              }}
              value={code}
              variant="underlined"
              onValueChange={setCode}
            />
          </CardBody>
          <Divider />
          <CardBody className="items-center pt-2">
            <Button
              className="w-full text-white font-semibold text-base"
              color="success"
              type="submit"
            >
              Submit
            </Button>
          </CardBody>
        </Form>
        <Divider />
        <CardFooter>
          <p>
            Enter the code sent to{" "}
            <span className="text-blue-400">{email}</span>. Can't find it? Check
            your spam folder.
          </p>
        </CardFooter>
      </Card>
    </>
  );
}
