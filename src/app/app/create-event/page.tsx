"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { useRouter } from "next/navigation";
import {today, getLocalTimeZone, DateValue} from "@internationalized/date";
import {DatePicker} from "@heroui/date-picker";
import { FormEvent, useState, useEffect } from "react";
import { BaseTable, CircularTable, TableTypes, TableCanvas} from "@/utils/tables"
import { createEvent } from "@/utils/api";
import { useEffectOnce } from "@/utils/components";
import {Slider} from "@heroui/slider";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@heroui/modal";

export default function CreateEventPage() {
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState<DateValue>((today(getLocalTimeZone()) as DateValue));
  const [rsvpDate, setRsvpDate] = useState<DateValue>((today(getLocalTimeZone()) as DateValue));
  const [tableCanvas, setTableCanvas] = useState(new TableCanvas([]));
  const [nextTableSize, setNextTableSize] = useState(0);
  const [meals, setMeals] = useState<{ name: string; amount: number }[]>([]);

  const [formStep, setFormStep] = useState(0);
  

  const {isOpen, onOpen, onOpenChange} = useDisclosure();

  const [mealAmount, setMealAmount] = useState(0);
  const [mealName, setMealName] = useState("");

  useEffectOnce(()=>{
    setTableCanvas(new TableCanvas([]))
  })

  const removeMeal = (mealName:object) => {
    setMeals((prevMeals) => prevMeals.filter((meal) => meal !== mealName));
  };

  const mealItems = meals.map(meal=>(
    <div key={meal['name']} className="flex justify-center items-center gap-3 mb-5">
        <div className="flex gap-3 justify-center items-center bg-[#3f3f46] p-2 border-r-3" >
          <p>{meal['amount']}</p>
          <p>{meal['name']}</p>
        </div>
        <Button isIconOnly aria-label="Remove" color="danger" onClick={() => removeMeal(meal)}>
          X
        </Button>
    </div>
  ))


  const submitCreateEvent = async ()=>{
    const serializedTables = [];
    for(const table of tableCanvas.tables){
      serializedTables.push({x:table.x, y:table.y, size:table.maxHolding})
    }
    const serializedMeals = meals.reduce((acc, { name, amount }) => name ? { ...acc, [name]: amount } : acc, {});  
    const event = await createEvent(
      name,
      serializedTables,
      eventDate.toDate(getLocalTimeZone()).getTime(),
      serializedMeals,
      rsvpDate.toDate(getLocalTimeZone()).getTime()
    )
    if(event === true){
      addToast({title: "Success", description: "event created"}) 
      await new Promise(r => setTimeout(r, 2000));
      router.push("/");
    }else{
      addToast({title: "Api Error", description: event}) 
    }
  }

  useEffect(()=>{
    if(formStep == 3){
      const canvas = document.getElementById("tables");
      tableCanvas.initHtml(canvas)
      tableCanvas.render()
    }
  })

  const formState = [
    {
      text:"What should this event be called?",
      content:(
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
      )
    },
    {
      text:"When does this event take place?",
      content:(
        // @ts-ignore
        <DatePicker className="max-w-[284px]" label="Event Date" value={eventDate} onChange={setEventDate}/>
      )
    },
    {
      text:"When is the latest people can register for this event?",
      content:(
        // @ts-ignore
        <DatePicker className="max-w-[284px]" label="RSVP Date" value={rsvpDate} onChange={setRsvpDate}/>
      )
    },
    {
      text:"What do the tables for this event look like?",
      content:(
        <>
          <canvas id="tables" className="h-[460px] w-[1000px] border-[1px solid #000]"/> 
          <div className="flex w-[720px] gap-4 items-center justify-center">
              <Slider
                className="max-w-md"
                defaultValue={1}
                value={nextTableSize}
                onChange={(e)=>{setNextTableSize((e as number))}}
                label="Table Size "
                maxValue={64}
                minValue={0}
                step={1}
              />
              <Button id="addTable" onPress={(_)=>{tableCanvas.addTable(new CircularTable(5, 5, nextTableSize*2, 0, nextTableSize));tableCanvas.render()}}>Add Table</Button>

          </div>

        
        </>
      )
    },
    {
      text:"What can people eat in this event?",
      content:(
        <>
          <div>
            {mealItems}
          </div>
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
            value={mealAmount}
            onChange={(e)=>{setMealAmount((e as number))}}
            label="Meal Amount"
            maxValue={500}
            minValue={0}
            step={1}
          />
          <Button id="addMeal" onPress={(_)=>{setMeals([...meals, {"amount":mealAmount, "name":mealName}])}}>Add Meal</Button>
        </>

      )
    },
    {
      text:"Checking Everything over",
      content:(
        <>
          <h3>{name}</h3>
          <h6>When: {eventDate.toString()}</h6>
          <h6>Latest Registration: {rsvpDate.toString()}</h6>
          <h6>Meals: {Object.keys(meals).length} options</h6>
        </>
      )
    }
  ]


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
        
        <div className="flex justify-between w-[100%] min-w-96 mt-4">
          {formStep < 5 && (
            <Button id="next" onPress={(_)=>{setFormStep(formStep + 1)}}>Next</Button>
          )}
          {formStep == 5 && (
            <Button id="submit" onPress={onOpen}>Submit</Button>
          )}
          {formStep > 0 && (
            <Button id="back" onPress={(_)=>setFormStep(formStep - 1)}>Back</Button>
          )}
        </div>
        </CardFooter>
      </Card>

    </div>



    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Submit Event</ModalHeader>
              <ModalBody>
                <p>
                  Are you sure you want to submit this event? some details can't be changed after its been submitted
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
