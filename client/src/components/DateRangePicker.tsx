import React from 'react';
import { format, isAfter, isValid } from 'date-fns';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (startDate: Date | null, endDate: Date | null) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempStartDate, setTempStartDate] = React.useState<Date | null>(startDate);
  const [tempEndDate, setTempEndDate] = React.useState<Date | null>(endDate);
  const [errors, setErrors] = React.useState<{ startDate?: string; endDate?: string }>({});
  const datePickerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const validateDates = (start: Date | null, end: Date | null): boolean => {
    const newErrors: { startDate?: string; endDate?: string } = {};
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    // Validate start date
    if (start) {
      if (!isValid(start)) {
        newErrors.startDate = 'Invalid start date';
      } else if (isAfter(start, today)) {
        newErrors.startDate = 'Start date cannot be in the future';
      }
    }

    // Validate end date
    if (end) {
      if (!isValid(end)) {
        newErrors.endDate = 'Invalid end date';
      } else if (isAfter(end, today)) {
        newErrors.endDate = 'End date cannot be in the future';
      }
    }

    // Validate date range
    if (start && end && isAfter(start, end)) {
      newErrors.startDate = 'Start date must be before end date';
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    setTempStartDate(date);
    validateDates(date, tempEndDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    setTempEndDate(date);
    validateDates(tempStartDate, date);
  };

  const handleApply = () => {
    if (validateDates(tempStartDate, tempEndDate)) {
      onChange(tempStartDate, tempEndDate);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    setErrors({});
    onChange(null, null);
    setIsOpen(false);
  };

  const formatDateDisplay = () => {
    if (!startDate && !endDate) return 'Select date range';
    if (startDate && !endDate) return `From ${format(startDate, 'MMM dd, yyyy')}`;
    if (!startDate && endDate) return `Until ${format(endDate, 'MMM dd, yyyy')}`;
    return `${format(startDate!, 'MMM dd, yyyy')} - ${format(endDate!, 'MMM dd, yyyy')}`;
  };

  return (
    <div className="relative" ref={datePickerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
      >
        <Calendar size={16} />
        <span>{formatDateDisplay()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 p-4 bg-[#2D2E36] border border-gray-700 rounded-lg shadow-lg z-10 w-80">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm mb-1">Start Date</label>
              <input
                type="date"
                value={tempStartDate ? format(tempStartDate, 'yyyy-MM-dd') : ''}
                onChange={handleStartDateChange}
                max={format(new Date(), 'yyyy-MM-dd')}
                className={`w-full p-2 bg-gray-800 border ${errors.startDate ? 'border-red-500' : 'border-gray-700'} rounded text-white`}
              />
              {errors.startDate && (
                <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm mb-1">End Date</label>
              <input
                type="date"
                value={tempEndDate ? format(tempEndDate, 'yyyy-MM-dd') : ''}
                onChange={handleEndDateChange}
                max={format(new Date(), 'yyyy-MM-dd')}
                className={`w-full p-2 bg-gray-800 border ${errors.endDate ? 'border-red-500' : 'border-gray-700'} rounded text-white`}
              />
              {errors.endDate && (
                <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
              )}
            </div>
            <div className="flex justify-between mt-2">
              <button
                onClick={handleClear}
                className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
              >
                Clear
              </button>
              <button
                onClick={handleApply}
                disabled={Object.keys(errors).length > 0}
                className={`px-3 py-1 rounded ${
                  Object.keys(errors).length > 0
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 