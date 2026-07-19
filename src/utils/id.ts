export const createId = (prefix = 'item') => `${prefix}-${crypto.randomUUID()}`
