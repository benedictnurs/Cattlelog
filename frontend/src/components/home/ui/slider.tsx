import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  value: number[];
  onValueChange?: (value: number[]) => void;
  formatValue?: (n: number) => string;
}

export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(
  (
    {
      className,
      value,
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      formatValue,
      ...props
    },
    ref,
  ) => {
    return (
      <SliderPrimitive.Root
        ref={ref}
        className={[
          "relative flex w-full touch-none select-none items-center pt-6 pb-2",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={onValueChange}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-gradient-to-r from-[#E05346] via-[#FFD700] to-[#3E8D40]">
          <SliderPrimitive.Range className="absolute h-full bg-transparent" />
        </SliderPrimitive.Track>
        {value.map((v, i) => (
          <SliderPrimitive.Thumb
            key={i}
            className="absolute left-1/2 -translate-x-[50%] -translate-y-1/2 flex-shrink-0 border border-gray-500 bg-[#747474] shadow focus:outline-none hover:ring-1 hover:ring-gray-500"
            style={{ width: 10, height: 10, borderRadius: 1000 }}
          >
            <span className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded text-[12px] text-gray-800">
              {formatValue ? formatValue(v) : String(v)}
            </span>
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Root>
    );
  },
);
Slider.displayName = "Slider";
export default Slider;
