import { Card, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { InputOtp } from "@heroui/input-otp";

export default function VerifyPage() {
  return (
    <Card className="w-5xl">
      <CardBody>
        <span className="text-2xl text-bold">Verify</span>
        <Divider />
        <InputOtp className="overflow-hidden" length={6} variant="underlined" />
        <Divider />
        <p className="text-s color-gray">Enter the code sent to your email.</p>
      </CardBody>
    </Card>
  );
}
