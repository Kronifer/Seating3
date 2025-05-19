"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { useRouter } from "next/navigation";
import { getLocalTimeZone, DateValue, now } from "@internationalized/date";
import { DatePicker } from "@heroui/date-picker";
import { useState, useEffect } from "react";
import { Slider } from "@heroui/slider";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { Checkbox } from "@heroui/checkbox";

import { useEffectOnce } from "@/utils/components";
import { createEvent } from "@/utils/api";
import { CircularTable, TableCanvas } from "@/utils/tables";

export default function CreateEventPage() {
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState<DateValue>(
    now(getLocalTimeZone()) as DateValue,
  );
  const [rsvpDate, setRsvpDate] = useState<DateValue>(
    now(getLocalTimeZone()) as DateValue,
  );
  const [tableCanvas, setTableCanvas] = useState(new TableCanvas([]));
  const [nextTableSize, setNextTableSize] = useState(1);
  const [tableId, setTableId] = useState(0);
  const [meals, setMeals] = useState<
    { key: number; name: string; amount: number; infinite: boolean }[]
  >([]);

  const [formStep, setFormStep] = useState(0);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [mealAmount, setMealAmount] = useState(1);
  const [mealName, setMealName] = useState("");
  const [mealKey, setMealKey] = useState(0);
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
    setTableCanvas(new TableCanvas([]));
  });

  const removeMeal = (mealKey: number) => {
    setMeals((prevMeals) => prevMeals.filter((meal) => meal.key !== mealKey));
  };

  const submitCreateEvent = async () => {
    const serializedTables = [];

    for (const table of tableCanvas.tables) {
      serializedTables.push({ x: table.x, y: table.y, size: table.maxHolding });
    }
    meals.forEach((meal) => {
      if (meal.infinite) {
        meal.amount = -1;
      }
    });
    const serializedMeals = meals.reduce(
      (acc, { name, amount }) => (name ? { ...acc, [name]: amount } : acc),
      {},
    );
    const event = await createEvent(
      name,
      serializedTables,
      eventDate.toDate(getLocalTimeZone()).getTime() / 1000,
      serializedMeals,
      rsvpDate.toDate(getLocalTimeZone()).getTime() / 1000,
    );

    if (event === true) {
      addToast({ title: "Success", description: "event created" });
      await new Promise((r) => setTimeout(r, 2000));
      location.href = "/user/dashboard/my-events";
    } else {
      addToast({ title: "Api Error", description: "Something went wrong" });
    }
  };

  useEffect(() => {
    if (formStep == 3) {
      const canvas = document.getElementById("tables");

      tableCanvas.initHtml(canvas);
      tableCanvas.render();
    }
  });

  const formState = [
    {
      text: "What should this event be called?",
      content: (
        <Input
          label="Event Name"
          name="eventname"
          placeholder=""
          type="text"
          value={name}
          onChange={(e) => {
            setName((name) => e.target.value);
          }}
        />
      ),
    },
    {
      text: "When does this event take place?",
      content: (
        <DatePicker
          hideTimeZone
          showMonthAndYearPickers
          className="max-w-[284px]"
          label="Event Date"
          //@ts-ignore
          value={eventDate}
          //@ts-ignore
          onChange={setEventDate}
        />
      ),
    },
    {
      text: "When is the latest people can register for this event?",
      content: (
        <DatePicker
          hideTimeZone
          showMonthAndYearPickers
          className="max-w-[284px]"
          label="RSVP Date"
          //@ts-ignore
          value={rsvpDate}
          //@ts-ignore
          onChange={setRsvpDate}
        />
      ),
    },
    {
      text: "What do the tables for this event look like?",
      content: (
        <>
          <canvas
            className="h-[460px] w-[1000px] border-[1px solid #000]"
            id="tables"
          />
          <div className="flex w-[720px] gap-4 items-center justify-center">
            <Button
              color="danger"
              onPress={(_) => {
                tableCanvas.tables = [];
                tableCanvas.render();
                setTableId(0);
              }}
            >
              Clear Tables
            </Button>
            <Slider
              className="max-w-md"
              defaultValue={1}
              label="Table Size "
              maxValue={64}
              minValue={1}
              step={1}
              value={nextTableSize}
              onChange={(e) => {
                setNextTableSize(e as number);
              }}
            />
            <Button
              id="addTable"
              onPress={(_) => {
                tableCanvas.addTable(
                  new CircularTable(200, 200, 300, 0, nextTableSize, tableId),
                );
                setTableId((tableId) => tableId + 1);
                tableCanvas.render();
              }}
            >
              Add Table
            </Button>
          </div>
          <div>
            <Table>
              <TableHeader>
                <TableColumn>TABLE</TableColumn>
                <TableColumn>SIZE</TableColumn>
              </TableHeader>
              <TableBody items={tableCanvas.tables}>
                {(item: CircularTable) => (
                  <TableRow key={item.tableId}>
                    <TableCell>{item.tableId + 1}</TableCell>
                    <TableCell>
                      <Input
                        className="w-[3lvw]"
                        defaultValue={item.maxHolding}
                        onValueChange={(v) => {
                          tableCanvas.tables[
                            tableCanvas.tables.indexOf(item)
                          ].maxHolding = parseInt(v);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      ),
    },
    {
      text: "What can people eat in this event?",
      content: (
        <>
          <div>
            <Table aria-label="Meals Table">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>AMOUNT</TableColumn>
                <TableColumn>INFINITE</TableColumn>
                <TableColumn>REMOVE</TableColumn>
              </TableHeader>
              <TableBody items={meals}>
                {(item) => (
                  <TableRow key={item.key}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.amount}</TableCell>
                    <TableCell>
                      <Checkbox
                        onValueChange={(v) => {
                          meals[item.key].infinite = v;
                        }}
                      >
                        Infinite?
                      </Checkbox>
                    </TableCell>
                    <TableCell>
                      <Button
                        color="danger"
                        onPress={(_) => {
                          removeMeal(item.key);
                        }}
                      >
                        X
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <br />
          <br />
          <Input
            label="Meal Name"
            labelPlacement="outside"
            name="Meal"
            placeholder=" "
            type="input"
            value={mealName}
            onChange={(e) => {
              setMealName((mealName) => e.target.value);
            }}
          />
          <Slider
            className="max-w-md"
            defaultValue={1}
            label="Meal Amount"
            maxValue={500}
            minValue={1}
            step={1}
            value={mealAmount}
            onChange={(e) => {
              setMealAmount(e as number);
            }}
          />
          <Button
            id="addMeal"
            onPress={(_) => {
              setMeals([
                ...meals,
                {
                  key: mealKey,
                  amount: mealAmount,
                  name: mealName,
                  infinite: false,
                },
              ]);
              setMealKey((mealKey) => mealKey + 1);
            }}
          >
            Add Meal
          </Button>
        </>
      ),
    },
    {
      text: "Checking Everything over",
      content: (
        <>
          <h3>{name}</h3>
          <h6>
            When:{" "}
            {month[eventDate.month - 1] +
              " " +
              eventDate.day +
              ", " +
              eventDate.year}
          </h6>
          <h6>
            Latest Registration:{" "}
            {month[rsvpDate.month - 1] +
              " " +
              rsvpDate.day +
              ", " +
              rsvpDate.year}
          </h6>
          <h6>Meals: {Object.keys(meals).length} options</h6>
        </>
      ),
    },
  ];

  const router = useRouter();

  return (
    <>
      <div className="flex flex-col items-center justify-center ">
        <span className="text-4xl mb-20">Create A New Event</span>

        <Card className="flex items-center justify-center p-4">
          <CardHeader className="text-center">
            <span className="text-xl mb-10">{formState[formStep].text}</span>
          </CardHeader>
          <CardBody className="flex items-center">
            {formState[formStep].content}
          </CardBody>
          <CardFooter>
            <div className="flex flex-row-reverse justify-between w-[100%] min-w-96 mt-4">
              {formStep < 5 && (
                <Button
                  color="primary"
                  id="next"
                  onPress={(_) => {
                    setFormStep(formStep + 1);
                  }}
                >
                  Next
                </Button>
              )}
              {formStep == 5 && (
                <Button color="success" id="submit" onPress={onOpen}>
                  Submit
                </Button>
              )}
              {formStep > 0 && (
                <Button id="back" onPress={(_) => setFormStep(formStep - 1)}>
                  Back
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Submit Event
              </ModalHeader>
              <ModalBody>
                <p>
                  Are you sure you want to submit this event? Some details can't
                  be changed after its been submitted.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={submitCreateEvent}>
                  Confirm
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
