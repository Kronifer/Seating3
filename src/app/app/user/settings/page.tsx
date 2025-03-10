"use client";
import { Avatar } from "@heroui/avatar";
import { Skeleton } from "@heroui/skeleton";
import { FormEvent, useEffect, useState } from "react";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";

import { getUser, updateUser, User } from "@/utils/api";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";

export default function UserSettingPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [user, setUser] = useState({} as any);
  const [emailInvalid, setEmailInvalid] = useState(false);

  useEffect(() => {
    getUser()?.then((data) => {
      setFirstName(data.name.first);
      setLastName(data.name.last);
      setUsername(data.username);
      setEmail(data.email);
      setLoading(false);
      setUser(data);
    });
  });

  function validateUsername(value: string) {
    if(value.length < 5) {
      return "Username must be at least 5 characters long.";
    }
  }

  function validateFirstName(value: string) {
    if(value.length < 1) {
      return "First Name must be at least 1 character long."
    }
  }

  function validateLastName(value: string) {
    if(value.length < 1) {
      return "Last Name must be at least 1 character long."
    }
  }

  function validateEmail(value: string) {
    if(emailInvalid) {
      return "Email already in use.";
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    var verifyEmail = false;
    e.preventDefault();
    let u = {name: {first: "", last: ""}, email: "", username: ""} as User;
    if(firstName == user.name.first && lastName == user.name.last) {
      delete u.name;
    }
    else {
      u.name!.first = firstName;
      u.name!.last = lastName;
    }
    if(username == user.username) {
      delete u.username;
    }
    else {
      u.username = username;
    }
    if(email == user.email) {
      delete u.email;
    }
    else {
      u.email = email;
      verifyEmail = true;
    }
    let p = updateUser(user);
    if(p == undefined) {
      addToast({
        color: "danger",
        title: "Session expired.",
        timeout: 1000
      })
      setTimeout(() => {
        location.href = "/login";
      }, 1000)
      return;
    }
    p.then(success => {
      if(!success) {
        const a = setInterval(() => {
          setEmailInvalid(true);
          (document.getElementById("email")! as HTMLInputElement).reportValidity();
          if((document.getElementById("email")! as HTMLInputElement).getAttribute("aria-invalid") == "true") {
            setEmailInvalid(false);
            clearInterval(a);
          }
        })
      }
      else {
        addToast({
          color: "success",
          title: "Successfully updated!",
          timeout: 1000,
        })
        if(verifyEmail) {
          sessionStorage.setItem("email", email);
          setTimeout(() => {
            location.href = "/verify-email"
          }, 1000)
        }
        else {
          setTimeout(() => {
            location.reload();
          }, 1000)
        }
      }
    })
  }

  return (
    <>
      <span className="text-4xl mb-4">User Settings</span>
      <div className="flex justify-center pt-2 pb-2">
        {loading && (<Skeleton className="rounded-full"><Avatar size="lg"></Avatar></Skeleton>)}
        {!loading && (<Avatar size="lg" name={firstName}></Avatar>)}
      </div>
      <Card className="w-full">
        <Form validationBehavior="native" onSubmit={submit}>
          <CardBody className="gap-3">
            {loading && (
            <>
            <Skeleton className="rounded-lg" isLoaded={!loading}>
              <Input></Input>
            </Skeleton>
            <Skeleton className="rounded-lg" isLoaded={!loading}>
            <Input></Input>
            </Skeleton>
            <Skeleton className="rounded-lg" isLoaded={!loading}>
            <Input></Input>
            </Skeleton>
            <Skeleton className="rounded-lg" isLoaded={!loading}>
            <Input></Input>
            </Skeleton>
            </>
            )}
            {!loading && (
              <>
              <Input type="text" label="First Name" labelPlacement="outside" placeholder=" " value={firstName} onValueChange={setFirstName} validate={validateFirstName}></Input>
              <Input type="text" label="Last Name" labelPlacement="outside" placeholder=" " value={lastName} onValueChange={setLastName} validate={validateLastName}></Input>
              <Input type="text" label="Username" labelPlacement="outside" placeholder=" " value={username} onValueChange={setUsername} validate={validateUsername}></Input>
              <Input type="text" id="email" label="Email" labelPlacement="outside" placeholder=" " value={email} onValueChange={setEmail} validate={validateEmail}></Input>
              </>
            )}
          </CardBody>
          <Divider/>
          <CardBody>
            <Button color="default" className="text-base font-semibold text-white w-full" onPress={()=>{location.href="/reset-password"}}>Change Password</Button>
          </CardBody>
          <Divider />
          <CardFooter>
            <Button type="submit" color="success" className="text-base font-semibold text-white w-full">Submit</Button>
          </CardFooter>
        </Form>
      </Card>
    </>
  );
}
