"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { forgotUsername } from "@/utils/api";

export default function UsernamePage() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    forgotUsername(email).then((success) => {
      if (success) {
        addToast({
          color: "success",
          title: "Success!",
          description:
            "Sent the username associated with the email provided to your inbox if it exists in the database.",
          timeout: 1000,
        });
        setTimeout(() => {
          router.push("/login");
        }, 1000);
      } else {
        addToast({
          color: "danger",
          title: "Something went wrong! Please try again later.",
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
      <span className="text-4xl">Forgot Username</span>
      <br />
      <br />
      <Card className="w-1/3 items-center inline-block">
        <Form
          className="items-center gap-3"
          validationBehavior="native"
          onSubmit={submit}
        >
          <CardBody className="items-center pb-0">
            <Input
              isRequired
              id="email"
              label="Email"
              labelPlacement="outside"
              name="email"
              placeholder=" "
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
          </CardBody>
          <Divider />
          <CardFooter className="items-center pt-1">
            <Button
              className="w-full text-white font-semibold text-base"
              color="success"
              type="submit"
            >
              Submit
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </>
  );
}
