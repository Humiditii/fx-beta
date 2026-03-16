import { addMinutes, format, isAfter } from 'date-fns';

export const getCurrentDateUTC = () => new Date();

export const manipulateDate = (date: Date, amount: number, unit: any, type: 'add' | 'subtract') => {
  if (unit === 'minutes') {
    return type === 'add' ? addMinutes(date, amount) : addMinutes(date, -amount);
  }
  // Add more as needed
  return date;
};

export const isExpired = (expiryDate: Date) => isAfter(new Date(), expiryDate);

export const formatDate = (date: Date, formatStr = 'yyyy-MM-dd HH:mm:ss') => format(date, formatStr);
