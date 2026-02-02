export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '—'
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatNumber = (value: number | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '—'
  }
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export const formatPercentage = (value: number | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '—'
  }
  return `${value >= 0 ? '+' : ''}${formatNumber(value, decimals)}%`
}

export const maskPAN = (pan: string): string => {
  if (pan.length !== 10) return pan
  return `${pan.substring(0, 5)}****${pan.substring(9)}`
}

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export const formatDate = (dateString: string | number[] | undefined | null): string => {
  if (!dateString) return 'N/A'
  
  let date: Date
  
  // Handle array format [year, month, day] from Java LocalDate
  if (Array.isArray(dateString)) {
    if (dateString.length >= 3) {
      // Month in Date constructor is 0-indexed, so subtract 1
      date = new Date(dateString[0], dateString[1] - 1, dateString[2])
    } else {
      return 'N/A'
    }
  } else {
    date = new Date(dateString)
  }
  
  if (isNaN(date.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
