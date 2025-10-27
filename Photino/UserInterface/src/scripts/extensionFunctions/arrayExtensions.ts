interface Array<T> {
    firstOrDefault(predicate: (value: T) => boolean, defaultValue?: T): T | undefined;
    orderBy(selector: (value: T) => any, direction?: 'asc' | 'desc'): T[];
    groupBy<K>(selector: (item: T) => K): Record<string, T[]>;
}
  
Array.prototype.firstOrDefault = function<T>(this: T[], predicate: (value: T) => boolean, defaultValue?: T): T | undefined {
  for (let i = 0; i < this.length; i++) {
    if (predicate(this[i])) {
      return this[i];
    }
  }
  return defaultValue === undefined ? undefined : defaultValue;
};

Array.prototype.orderBy = function<T>(this: T[], selector: (value: T) => any, direction: 'asc' | 'desc' = 'asc'): T[] {
  const sortedArray = [...this];
  return sortedArray.sort((a, b) => {
    const valueA = selector(a);
    const valueB = selector(b);
      
    if (valueA < valueB) {
      return direction === 'asc' ? -1 : 1;
    } else if (valueA > valueB) {
      return direction === 'asc' ? 1 : -1;
    } else {
      return 0;
    }
  });
};
  
Array.prototype.groupBy = function <T, K>(selector: (item: T) => K): Record<string, T[]> {
  return this.reduce((result: Record<string, T[]>, currentValue: T) => {
      const groupKey = selector(currentValue) as unknown as string;

      // Initialize the group if it doesn't exist
      if (!result[groupKey]) {
          result[groupKey] = [];
      }

      // Push the current element to the correct group
      result[groupKey].push(currentValue);

      return result;
  }, {} as Record<string, T[]>);
};