import { Button } from "@heroui/button";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";

interface MenuBarProps {
  selected: number | null;
}

export const MenuBar = ({ selected }: MenuBarProps) => {
  return (
    <>
      <Drawer
        backdrop="transparent"
        className="rounded-none w-1/5 -z-100"
        hideCloseButton={true}
        isDismissable={false}
        isOpen={true}
        motionProps={{
          variants: {
            enter: {
              opacity: 1,
            },
          },
        }}
        placement="left"
      >
        <DrawerContent className="justify-center items-center">
          <DrawerBody className="w-full justify-center p-0">
            <Button
              className="w-full rounded-none h-1/6 text-base font-semibold"
              color={selected !== null && selected == 0 ? "primary" : "default"}
              disableAnimation={true}
              variant="flat"
            >
              Create Event
            </Button>
            <Button
              className="w-full rounded-none h-1/6 text-base font-semibold"
              color={selected !== null && selected == 1 ? "primary" : "default"}
              disableAnimation={true}
              variant="flat"
            >
              Join Event
            </Button>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};
