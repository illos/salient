import * as React from 'react';
import { cn } from 'cn';

/** Quiet textarea: the same borderless `sub` inset as Input. */
function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-24 w-full rounded-md border-0 bg-muted px-3.5 py-2.5 text-base text-foreground caret-primary transition-colors duration-(--motion-fast) outline-none placeholder:text-muted-foreground focus-visible:bg-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:outline-2 aria-invalid:outline-destructive md:text-base',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
