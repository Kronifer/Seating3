"use client";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Slider } from "@heroui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { PressEvent } from "@react-types/shared";
import { useState } from "react";
import { Textarea } from "@heroui/input";
import { addToast } from "@heroui/toast";

import { TableCanvas, CircularTable } from "@/utils/tables";
import { useEffectOnce } from "@/utils/components";
import {
  getMealsBooking,
  getTablesBooking,
  reserveSeats,
  reserveMeals,
} from "@/utils/api";
import { Counter } from "@/components/counter";
import { CounterProvider } from "@/components/counterContext";

export default function ManageBookingPage() {
  const [formStep, setFormStep] = useState(0);
  const [partySize, setPartySize] = useState(1);
  const [eventCode, setEventCode] = useState<string>("");
  const [tables, setTables] = useState<any>([]);
  const [meals, setMeals] = useState<any>();
  const [tableCanvas, setTableCanvas] = useState(new TableCanvas([]));
  const [selectedTable, updateSelectedTable] = useState<number>(-1);
  const [mealsSelected, setMealsSelected] = useState<any>({});
  const [notes, setNotes] = useState<string>("");

  function editBooking() {
    var a = reserveSeats(eventCode, selectedTable, partySize);

    if (a === undefined) {
      location.href = "/user/dashboard/joined-events";

      return;
    }
    var b = reserveMeals(eventCode, mealsSelected, notes);

    if (b === undefined) {
      location.href = "/user/dashboard/joined-events";

      return;
    }
    a.then((res) => {
      if (!res) {
        addToast({
          color: "danger",
          title: "Error booking tables!",
          timeout: 1000,
        });
        setTimeout(() => {
          location.href = "/user/dashboard/joined-events";
        }, 500);

        return;
      }
    });
    b.then((res) => {
      if (!res) {
        addToast({
          color: "danger",
          title: "Error booking meals!",
          timeout: 1000,
        });
        setTimeout(() => {
          location.href = "/user/dashboard/joined-events";
        }, 500);

        return;
      }
    });
    setTimeout(() => {
      addToast({
        color: "success",
        title: "Booking updated successfully!",
        timeout: 1000,
      });
      setTimeout(() => {
        location.href = "/user/dashboard/joined-events";
      }, 1000);
    }, 500);
  }

  function loadTables() {
    var a = setInterval(() => {
      tableCanvas.initHtml(document.getElementById("tables")!);
      tables.forEach((t: any) => {
        var table = new CircularTable(
          t[0],
          t[1],
          300,
          t[2],
          t[3],
          tables.indexOf(t),
        );

        tableCanvas.addTable(table);
      });
      if (tableCanvas.tables.length !== 0) {
        tableCanvas.render();
        tableCanvas.blockMovement = true;
        clearInterval(a);
      }
    }, 50);

    return "";
  }
  function setSelectedTable(e: PressEvent) {
    var btn = e.target as HTMLButtonElement;

    updateSelectedTable(parseInt(btn.id.split("-")[1]));
    setFormStep(2);
  }
  useEffectOnce(() => {
    const code = sessionStorage.getItem("eventCode");

    if (code !== null) {
      setEventCode(code);
    } else {
      location.href = "/user/dashboard/joined-events";

      return;
    }
    var a = getTablesBooking(code!);

    if (a === undefined) {
      location.href = "/user/dashboard/joined-events";

      return;
    }
    a.then((res) => {
      if (res.status === 200) {
        res.json.forEach((t: any) => {
          t.push(false);
        });
        setTables(res.json);
      } else {
        location.href = "/user/dashboard/joined-events";

        return;
      }
    });
    var b = getMealsBooking(code!);

    if (b === undefined) {
      location.href = "/user/dashboard/joined-events";

      return;
    }
    b.then((res) => {
      if (res.status === 200) {
        res.json.forEach((t: any) => {
          t.push(0);
        });
        setMeals(res.json);
        console.log(res.json);
      } else {
        location.href = "/user/dashboard/joined-events";

        return;
      }
    });
  });

  return (
    <Card className="flex items-center justify-center p-4">
      <CardHeader>
        <h1 className="text-2xl font-bold">Manage Booking</h1>
      </CardHeader>
      <Divider />
      {formStep === 0 && (
        <CardBody>
          <h2 className="text-lg font-bold">Select Party Size</h2>
          <br />
          <div className="w-full flex items-center justify-center">
            <Slider
              className="max-w-4xl"
              label="Party Size"
              maxValue={10}
              minValue={1}
              step={1}
              value={partySize}
              onChange={(e) => {
                setPartySize(e as number);
              }}
            />
          </div>
        </CardBody>
      )}
      {formStep === 1 && (
        <CardBody>
          <h2 className="text-lg font-bold">Select Table</h2>
          <br />
          <canvas
            className="h-[460px] w-[1000px] border-[1px solid #000]"
            id="tables"
          />
          {loadTables()}
          <Table>
            <TableHeader>
              <TableColumn>TABLE NUMBER</TableColumn>
              <TableColumn>AVAILABLE SEATS</TableColumn>
              <TableColumn>TOTAL SEATS</TableColumn>
              <TableColumn>SELECT</TableColumn>
            </TableHeader>
            <TableBody items={tables}>
              {(item: any) => {
                return (
                  <TableRow key={tables.indexOf(item)}>
                    <TableCell>{tables.indexOf(item) + 1}</TableCell>
                    <TableCell>{item[2]}</TableCell>
                    <TableCell>{item[3]}</TableCell>
                    <TableCell className="items-center justify-center flex">
                      <Button
                        className="w-full"
                        id={"select-" + tables.indexOf(item)}
                        isDisabled={partySize > item[2]}
                        onPress={(e) => {
                          setSelectedTable(e);
                        }}
                      >
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              }}
            </TableBody>
          </Table>
        </CardBody>
      )}
      {formStep === 2 && (
        <CardBody>
          <h2 className="text-lg font-bold">Select Meals</h2>
          <br />
          <CounterProvider>
            <Table>
              <TableHeader>
                <TableColumn>MEAL NAME</TableColumn>
                <TableColumn>AMOUNT AVAILABLE</TableColumn>
                <TableColumn>QUANTITY</TableColumn>
              </TableHeader>
              <TableBody items={meals}>
                {(item: any) => {
                  return (
                    <TableRow key={meals.indexOf(item)}>
                      <TableCell>{item[0]}</TableCell>
                      <TableCell>{item[1]}</TableCell>
                      <TableCell>
                        <Counter
                          innerId={"val-" + item[0]}
                          maxMeals={partySize}
                        />
                      </TableCell>
                    </TableRow>
                  );
                }}
              </TableBody>
            </Table>
          </CounterProvider>
          <Textarea
            label="Notes"
            placeholder="Enter any requests or information about dietary restrictions here."
            value={notes}
            onValueChange={setNotes}
          />
        </CardBody>
      )}
      {formStep === 3 && (
        <CardBody>
          <h2 className="text-lg font-bold">Booking Summary</h2>
          <br />
          <ul className="list-disc ml-1">
            <li>Party Size: {partySize}</li>
            <li>Table Number: {selectedTable + 1}</li>
            <li>
              Meals Selected:
              <ul className="list-disc ml-2">
                {meals.map((m: any) => {
                  return (
                    <li key={m[0]}>
                      {m[0]}: {mealsSelected[m[0]]}
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>
        </CardBody>
      )}
      <Divider />
      <CardFooter className="flex flex-row-reverse justify-between mt-4">
        {formStep === 3 && (
          <Button
            color="success"
            onPress={(_) => {
              editBooking();
            }}
          >
            Submit
          </Button>
        )}
        {formStep !== 1 && formStep !== 3 && (
          <Button
            color="primary"
            onPress={(_) => {
              setFormStep((formStep) => formStep + 1);
              if (formStep === 2) {
                meals.forEach((m: any) => {
                  var meal = document.getElementById("val-" + m[0]);

                  if (meal !== null) {
                    mealsSelected[m[0]] = parseInt(meal.innerText);
                  }
                });
              }
            }}
          >
            Next
          </Button>
        )}
        {formStep > 0 && (
          <Button
            onPress={(_) => {
              setFormStep((formStep) => formStep - 1);
            }}
          >
            Back
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
