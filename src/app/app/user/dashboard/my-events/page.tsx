"use client";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/skeleton";
import { useState } from "react";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalFooter,
  ModalHeader,
  ModalContent,
  ModalBody,
  useDisclosure,
} from "@heroui/modal";
import { addToast } from "@heroui/toast";

import { deleteEvent, exportEvent, getEvents } from "@/utils/api";
import { useEffectOnce } from "@/utils/components";

export default function MyEventsPage() {
  const [events, setEvents] = useState([] as any[]);
  const [loaded, setLoaded] = useState(true);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedEvent, setSelectedEvent] = useState("");

  function del() {
    var a = deleteEvent(selectedEvent);

    if (a === undefined) {
      addToast({
        color: "danger",
        title: "Error deleting event!",
        timeout: 1000,
      });

      return;
    }
    a.then((e) => {
      if (e) {
        addToast({
          color: "success",
          title: "Event deleted successfully!",
          timeout: 1000,
        });
        setTimeout(() => {
          location.reload();
        }, 1000);
      } else {
        addToast({
          color: "danger",
          title: "Error deleting event!",
          timeout: 1000,
        });
      }
    });
  }

  useEffectOnce(() => {
    var e = getEvents();

    if (e === undefined) {
      return;
    }
    e.then((e) => {
      if (e.status === undefined) {
        setEvents(e);
        setLoaded(true);
      }
    });
  });
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

  return (
    <div className="flex flex-row w-full space-x-[1%]">
      <Button
        className="w-[30lvh] h-[25lvh] text-2xl shrink-0"
        disableAnimation={true}
        variant="flat"
        onPress={(_) => {
          location.href = "/user/create-event";
        }}
      >
        Create Event
      </Button>
      {events.map((e) => {
        e.date = new Date(Date.parse(e.date));
        e.rsvpBy = new Date(Date.parse(e.rsvpBy));

        return (
          <Card key={e.eventId} className="w-[30lvh] h-[25lvh] shrink-0">
            <CardHeader>
              <h1 className="text-2xl">{e.name}</h1>
            </CardHeader>
            <Divider />
            <CardBody className="justify-center overflow-hidden">
              <ul>
                <li>
                  Date:{" "}
                  {month[e.date.getMonth()] +
                    " " +
                    e.date.getDate() +
                    ", " +
                    e.date.getFullYear() +
                    ", " +
                    e.date.getHours() +
                    ":" +
                    e.date.getMinutes().toString().padStart(2, "0")}
                </li>
                <li>Registered Parties: {e.registered_count}</li>
                <li>Invite Code: {e.eventId}</li>
              </ul>
            </CardBody>
            <Divider />
            <CardFooter>
              <div className="flex items-center flex-row w-full space-x-[2%]">
                <Button
                  className="w-full"
                  onPress={(_) => {
                    var a = exportEvent(e.eventId);

                    if (a === undefined) {
                      return;
                    }
                    a.then((b) => {
                      if (b.status === 200) {
                        const blob = new Blob([b.data], { type: "text/csv" });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");

                        a.href = url;
                        a.download = `event-${e.eventId}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        a.remove();
                      }
                    });
                  }}
                >
                  Export Event
                </Button>
                <Button
                  className="w-full"
                  color="danger"
                  onPress={(_) => {
                    onOpen();
                    setSelectedEvent(e.eventId);
                  }}
                >
                  Delete Event
                </Button>
              </div>
            </CardFooter>
          </Card>
        );
      })}
      <Skeleton
        className="w-[30lvh] h-[24lvh] rounded-lg"
        id="skeleton1"
        isLoaded={loaded}
      />
      <Skeleton
        className="w-[30lvh] h-[24lvh] rounded-lg"
        id="skeleton2"
        isLoaded={loaded}
      />
      <Skeleton
        className="w-[30lvh] h-[24lvh] rounded-lg"
        id="skeleton3"
        isLoaded={loaded}
      />
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent className="shrink-0">
          <ModalHeader>Delete Event</ModalHeader>
          <Divider />
          <ModalBody>
            Are you sure you want to delete this event? This action cannot be
            undone.
          </ModalBody>
          <Divider />
          <ModalFooter>
            <Button
              color="danger"
              onPress={() => {
                onOpenChange();
                del();
              }}
            >
              Delete
            </Button>
            <Button variant="flat" onPress={onOpenChange}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
