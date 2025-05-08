"use client";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import { useState } from "react";

import { useEffectOnce } from "@/utils/components";
import { getEventInfo, joinEvent } from "@/utils/api";

export default function JoinEventPage() {
  const [inviteCode, setInviteCode] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [codeComplete, setCodeComplete] = useState(false);
  const [eventData, setEventData] = useState<any>(undefined);
  const month = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffectOnce(() => {
    setInviteCode(
      new URLSearchParams(window.location.search).get("inviteCode") ?? "",
    );
    if (inviteCode.length != 12) {
      setInviteCode("");
    }
    if (inviteCode != "" && inviteCode.length == 12) {
      fetchEventData();
    } else {
      setLoaded(true);
      setCodeComplete(false);
    }
  });

  function eventJoin() {
    if (Date.now() / 1000 > eventData.rsvpBy) {
      addToast({
        title: "Event Closed",
        description:
          "The event you are trying to join is closed. Please contact the event owner for more information.",
        color: "danger",
        timeout: 1000,
      });
      setTimeout(() => {
        location.href = "/user/dashboard/joined-events";
      }, 1000);
    }
    var a = joinEvent(inviteCode);

    if (a === undefined) {
      addToast({
        title: "Error",
        description:
          "An error occurred while joining the event. Please try again later.",
        color: "danger",
        timeout: 1000,
      });
      setTimeout(() => {
        location.href = "/user/dashboard/joined-events";
      }, 1000);

      return;
    }
    a.then((r) => {
      if (!r) {
        addToast({
          title: "Error",
          description:
            "An error occurred while joining the event. Please try again later.",
          color: "danger",
          timeout: 1000,
        });
        setTimeout(() => {
          location.href = "/user/dashboard/joined-events";
        }, 1000);

        return;
      }
      addToast({
        title: "Event Joined",
        description: "You have successfully joined the event.",
        color: "success",
        timeout: 1000,
      });
      setTimeout(() => {
        location.href = "/user/dashboard/joined-events";
      }, 1000);
    });
  }

  function fetchEventData() {
    if (inviteCode.length != 12) {
      addToast({
        title: "Invalid Invite Code",
        description:
          "The invite code you entered is invalid. Please check the code and try again.",
        color: "danger",
        timeout: 2000,
      });

      return;
    }
    setLoaded(false);
    var e = getEventInfo(inviteCode);

    if (e === undefined) {
      addToast({
        title: "Error",
        description:
          "An error occurred while fetching the event data. Please try again later.",
        color: "danger",
        timeout: 2000,
      });

      return;
    }
    e.then((r) => {
      if (r.status != 200) {
        addToast({
          title: "Error",
          description:
            "An error occurred while fetching the event data. Please try again later.",
          color: "danger",
          timeout: 2000,
        });

        return;
      }
      r.json.date = new Date(Date.parse(r.json.date));
      setEventData(r.json);
      setCodeComplete(true);
      setLoaded(true);
    });
  }

  return (
    <div className="flex text-center items-center justify-center w-full">
      {!loaded && <Spinner color="primary" label="Loading..." size="lg" />}
      {loaded && !codeComplete && (
        <Card className="w-1/3">
          <CardHeader>
            <h1 className="text-2xl font-bold">Join Event</h1>
          </CardHeader>
          <Divider />
          <CardBody>
            <Input
              label="Invite Code"
              type="text"
              value={inviteCode}
              onValueChange={setInviteCode}
            />
          </CardBody>
          <Divider />
          <CardFooter className="flex flex-row-reverse">
            <Button
              color="primary"
              onPress={(_) => {
                fetchEventData();
              }}
            >
              Next
            </Button>
          </CardFooter>
        </Card>
      )}
      {loaded && codeComplete && (
        <Card className="w-1/3">
          <CardHeader>
            <h1 className="text-2xl font-bold">{eventData.name}</h1>
          </CardHeader>
          <Divider />
          <CardBody>
            <ul>
              <li>Owner: {eventData.owner}</li>
              <li>
                Date:{" "}
                {month[eventData.date.getMonth()] +
                  " " +
                  eventData.date.getDate() +
                  ", " +
                  eventData.date.getFullYear()}
              </li>
              <li>Registered Parties: {eventData.register_count}</li>
            </ul>
          </CardBody>
          <Divider />
          <CardFooter className="flex flex-row-reverse">
            <Button
              color="primary"
              onPress={(_) => {
                eventJoin();
              }}
            >
              Join Event
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
