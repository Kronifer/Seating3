import { Card, CardBody, CardFooter } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { InputOtp } from "@heroui/input-otp";
import { Form } from "@heroui/form";
import { Button } from "@heroui/button";

export let email = "runkedillon@gmail.com";
export default function VerifyPage() {
  return (
    <>
      <span className="text-4xl">Verify your email to continue</span>
      <br />
      <br />
      <Card className="w-full">
        <CardBody className="items-center">
          <Form className="items-center" validationBehavior="native">
            <InputOtp
              isRequired
              id="code"
              label="Code"
              length={6}
              name="code"
              textAlign="center"
              variant="underlined"
            />
            <Button
              className="text-white font-base font-semibold w-full"
              color="success"
              type="submit"
            >
              Submit
            </Button>
          </Form>
        </CardBody>
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
