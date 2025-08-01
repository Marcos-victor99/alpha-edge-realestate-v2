import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import * as Popover from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

export interface FinancialDatePickerProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  mode?: 'single' | 'range';
  minDate?: Date;
  maxDate?: Date;
  // Presets financeiros específicos
  showPresets?: boolean;
  presetOptions?: {
    label: string;
    value: string;
    dateRange: { from: Date; to?: Date };
  }[];
}

const defaultPresets = [
  {
    label: 'Últimos 7 dias',
    value: '7d',
    dateRange: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      to: new Date()
    }
  },
  {
    label: 'Últimos 30 dias',
    value: '30d',
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date()
    }
  },
  {
    label: 'Últimos 3 meses',
    value: '3m',
    dateRange: {
      from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      to: new Date()
    }
  },
  {
    label: 'Últimos 6 meses',
    value: '6m',
    dateRange: {
      from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      to: new Date()
    }
  },
  {
    label: 'Este ano',
    value: 'ytd',
    dateRange: {
      from: new Date(new Date().getFullYear(), 0, 1),
      to: new Date()
    }
  },
  {
    label: 'Ano passado',
    value: 'ly',
    dateRange: {
      from: new Date(new Date().getFullYear() - 1, 0, 1),
      to: new Date(new Date().getFullYear() - 1, 11, 31)
    }
  }
];

export const FinancialDatePicker: React.FC<FinancialDatePickerProps> = ({
  selected,
  onSelect,
  placeholder = "Selecionar data",
  className,
  disabled = false,
  mode = 'single',
  minDate,
  maxDate,
  showPresets = true,
  presetOptions = defaultPresets
}) => {
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handlePresetSelect = (preset: typeof defaultPresets[0]) => {
    setSelectedPreset(preset.value);
    if (mode === 'single') {
      onSelect?.(preset.dateRange.to || preset.dateRange.from);
    } else {
      // Para range mode, seria necessário adaptar a interface
      onSelect?.(preset.dateRange.from);
    }
    setOpen(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedPreset(null); // Limpar preset quando selecionar data manualmente
    onSelect?.(date);
    if (mode === 'single') {
      setOpen(false);
    }
  };

  const displayValue = selected 
    ? format(selected, 'dd/MM/yyyy', { locale: ptBR })
    : placeholder;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "flex items-center justify-between w-48 px-3 py-2 text-sm",
            "border border-gray-200 rounded-lg",
            "bg-white hover:bg-gray-50",
            "text-left font-normal",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            !selected && "text-gray-500",
            className
          )}
        >
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <span>{displayValue}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className={cn(
            "z-50 w-auto p-0 bg-white rounded-lg border border-gray-200 shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          )}
          sideOffset={4}
        >
          <div className="flex">
            {/* Presets Sidebar */}
            {showPresets && (
              <div className="border-r border-gray-200 p-3 min-w-[200px]">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  Períodos Rápidos
                </div>
                <div className="space-y-1">
                  {presetOptions.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handlePresetSelect(preset)}
                      className={cn(
                        "w-full text-left px-2 py-1.5 text-sm rounded",
                        "hover:bg-gray-100 focus:bg-gray-100",
                        "focus:outline-none transition-colors",
                        selectedPreset === preset.value && "bg-blue-50 text-blue-700"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar */}
            <div className="p-3">
              <DayPicker
                mode={mode as any}
                selected={selected}
                onSelect={handleDateSelect}
                disabled={[
                  ...(minDate ? [{ before: minDate }] : []),
                  ...(maxDate ? [{ after: maxDate }] : [])
                ]}
                locale={ptBR}
                className="rdp"
                classNames={{
                  root: "rdp-root",
                  months: "rdp-months flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "rdp-month space-y-4",
                  month_caption: "rdp-month_caption flex justify-center pt-1 relative items-center",
                  caption_label: "rdp-caption_label text-sm font-medium",
                  nav: "rdp-nav space-x-1 flex items-center",
                  button_previous: "rdp-button_previous absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  button_next: "rdp-button_next absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  month_grid: "rdp-month_grid w-full border-collapse space-y-1",
                  weekdays: "rdp-weekdays flex",
                  weekday: "rdp-weekday text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                  week: "rdp-week flex w-full mt-2",
                  day: cn(
                    "rdp-day h-9 w-9 text-center text-sm p-0 relative",
                    "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                    "aria-selected:opacity-100 transition-colors",
                    "focus:shadow-[0_0_0_2px] focus:shadow-blue-500 focus:outline-none rounded-md"
                  ),
                  day_button: cn(
                    "rdp-day_button h-9 w-9 p-0 font-normal rounded-md",
                    "hover:bg-gray-100 focus:bg-gray-100 transition-colors"
                  ),
                  selected: "rdp-selected bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
                  today: "rdp-today bg-accent text-accent-foreground font-semibold",
                  outside: "rdp-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  disabled: "rdp-disabled text-muted-foreground opacity-50",
                  range_middle: "rdp-range_middle bg-accent text-accent-foreground",
                  hidden: "rdp-hidden invisible"
                }}
                showOutsideDays={true}
              />
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

// Componente compacto para uso em cards menores
export const CompactFinancialDatePicker: React.FC<FinancialDatePickerProps> = (props) => {
  return (
    <FinancialDatePicker
      {...props}
      showPresets={false}
      className={cn("w-36", props.className)}
    />
  );
};

export default FinancialDatePicker;