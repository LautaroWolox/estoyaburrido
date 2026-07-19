import { eachDayOfInterval, endOfWeek, format, isSameMonth, parseISO, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

export const todayKey = (date = new Date()) => format(date, 'yyyy-MM-dd')
export const monthKey = (date = new Date()) => format(date, 'yyyy-MM')
export const formatDate = (value: string, pattern = "d 'de' MMMM") => format(parseISO(value), pattern, { locale: es })
export const formatCurrency = (value: number, currency = 'ARS') => new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value)
export const weekDays = (date = new Date()) => eachDayOfInterval({ start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) })
export const isCurrentMonth = (value: Date, month: Date) => isSameMonth(value, month)
export const percentage = (value: number, total: number) => total > 0 ? Math.min(100, Math.round(value / total * 100)) : 0
