import { SQLDialect, type Table } from '$lib/types';
import { requiresLength } from './validators';
import type { TypeAndLength } from '$lib/types';

export function extractTypeAndLength(fullType: string): TypeAndLength {
  const match = fullType.match(/^([A-Z\s]+)\((\d+(?:,\d+)*)\)$/i);
  if (match) {
    const baseType = match[1].trim().toUpperCase();
    const lengthStr = match[2];
    const firstNumber = lengthStr.split(',')[0];
    const length = parseInt(firstNumber);
    return { baseType, length: isNaN(length) ? undefined : length };
  }
  return { baseType: fullType.toUpperCase(), length: undefined };
}

export function getCompatiblePrimaryKeys(
  visualTables: Table[],
  excludeTable: string,
  currentType: string,
  currentLength?: number,
  selectedDialect: SQLDialect = SQLDialect.MYSQL
): Array<{ table: string; column: string; type: string; length?: number }> {
  const compatibleKeys: Array<{ table: string; column: string; type: string; length?: number }> =
    [];

  if (!currentType) return compatibleKeys;

  for (const table of visualTables) {
    if (table.name !== excludeTable) {
      for (const column of table.columns) {
        if (column.primaryKey) {
          const { baseType, length } = extractTypeAndLength(column.type);
          const isTypeCompatible = baseType === currentType.toUpperCase();

          let isLengthCompatible = true;
          const columnLength = length || column.length;
          if (columnLength && currentLength) {
            isLengthCompatible = columnLength === currentLength;
          } else if (columnLength || currentLength) {
            if (
              requiresLength(baseType, selectedDialect) ||
              requiresLength(currentType, selectedDialect)
            ) {
              isLengthCompatible = false;
            }
          }

          if (isTypeCompatible && isLengthCompatible) {
            compatibleKeys.push({
              table: table.name,
              column: column.name,
              type: baseType,
              length: columnLength
            });
          }
        }
      }
    }
  }

  return compatibleKeys;
}
