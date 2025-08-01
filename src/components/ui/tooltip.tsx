import * as React from "react";
import { cn } from "@/lib/utils";

// Provider simplificado - não faz nada, apenas renderiza children
const TooltipProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { delayDuration?: number }
>(({ children, className, delayDuration, ...props }, ref) => (
  <div ref={ref} className={cn(className)} {...props}>
    {children}
  </div>
));
TooltipProvider.displayName = "TooltipProvider";

// Tooltip root - apenas um div wrapper
const Tooltip = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ children, className, ...props }, ref) => (
  <div ref={ref} className={cn("relative inline-block", className)} {...props}>
    {children}
  </div>
));
Tooltip.displayName = "Tooltip";

// Trigger - renderiza o children com title HTML nativo
const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ children, className, asChild, ...props }, ref) => {
  if (asChild) {
    // Se asChild, clona o elemento filho e adiciona o ref
    return React.cloneElement(children as React.ReactElement, {
      ref,
      className: cn((children as React.ReactElement).props.className, className),
      ...props
    });
  }
  
  return (
    <div ref={ref} className={cn(className)} {...props}>
      {children}
    </div>
  );
});
TooltipTrigger.displayName = "TooltipTrigger";

// Content - não renderiza nada visualmente, mas pode ser usado para extrair conteúdo
const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { 
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    hidden?: boolean;
  }
>(({ children, className, side, align, hidden, ...props }, ref) => {
  // Por simplicidade, não renderizamos o tooltip content
  // O sistema usar o atributo 'title' nativo do HTML
  return null;
});
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };