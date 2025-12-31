import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "grid place-content-center peer h-3 w-3 shrink-0 rounded-sm border-[1.5px] border-[#8B7355] shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#8B7355] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#6B4423] data-[state=checked]:text-white data-[state=checked]:border-[#6B4423]",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("grid place-content-center text-current")}
    >
      <Check className="h-2.5 w-2.5" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
