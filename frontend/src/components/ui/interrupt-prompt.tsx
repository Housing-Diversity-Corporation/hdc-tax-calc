import { AnimatePresence, motion } from "framer-motion"
import { Cross2Icon } from "@radix-ui/react-icons"
import { Button } from "./button"

interface InterruptPromptProps {
  isOpen: boolean
  close: () => void
}

export function InterruptPrompt({ isOpen, close }: InterruptPromptProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ top: 0, filter: "blur(5px)" }}
          animate={{
            top: -40,
            filter: "blur(0px)",
            transition: {
              type: "spring",
              filter: { type: "tween" },
            },
          }}
          exit={{ top: 0, filter: "blur(5px)" }}
          className="absolute left-1/2 flex -translate-x-1/2 overflow-hidden whitespace-nowrap rounded-full border bg-background py-1 text-center text-sm text-muted-foreground"
        >
          <span className="ml-2.5">Press Enter again to interrupt</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-1 mr-2.5 flex items-center h-auto w-auto p-0"
            type="button"
            onClick={close}
            aria-label="Close"
          >
            <Cross2Icon className="h-3 w-3" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
