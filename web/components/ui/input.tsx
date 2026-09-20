import * as React from 'react';
import { Input as InputPrimitive } from '@base-ui/react/input';
import { cn } from 'cn';

/** Quiet input: a borderless `sub` inset, 40px tall, `ph` fill and accent caret when focused. */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-md border-0 bg-muted px-3.5 py-1 text-base text-foreground caret-primary transition-colors duration-(--motion-fast) outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:bg-accent focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:outline-2 aria-invalid:outline-destructive md:text-base',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
