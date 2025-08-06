import pkg from 'node-sql-parser';
import { SQLDialect } from '$lib/types';
import type { Table, Column, Relationship, ParseResult } from '$lib/types';
import { schema } from '$lib/stores/app';
import { get } from 'svelte/store';

const { Parser } = pkg as any;
let tables: Table[] = [];

export function parseSQL(
  sql: string,
  selectedDialect: SQLDialect,
  resetPositions: boolean = false
): ParseResult {
  let statementCount = 0;
  let lineForError = -1;
  const cleanedSQL = cleanSQL(sql);
  const statements = splitStatements(cleanedSQL);
  const errors: string[] = [];

  const addError = (message: string, line: number) => {
    errors.push(`${message}`);
    if (lineForError === -1) lineForError = line;
  };

  tables = [];
  const relationships: Relationship[] = [];
  let tableCounter = 0;
  const parser = new Parser();

  for (const statement of statements) {
    statementCount++;
    if (isCreateTableStatement(statement)) {
      let ast;

      try {
        ast = parser.astify(statement, { database: selectedDialect });
      } catch (error: any) {
        addError(error?.message || 'Unknown parsing error', statementCount);
        continue;
      }

      const table = parseCreateTable(ast, tableCounter, resetPositions);
      if (table) {
        if (tables.some((t) => t.name === table.name))
          addError(`Table "${table.name}" already exists.`, statementCount);

        tables.push(table);
        tableCounter++;
      }
    } else {
      addError(`Unsupported statement type: ${statement}`, statementCount);
    }
  }

  extractRelationships(tables, relationships);

  const result: ParseResult = {
    success: true,
    schema: {
      tables,
      relationships
    }
  };

  if (errors.length > 0) {
    result.success = false;
    result.error = {
      message: `${errors.join('\n')}`,
      statementIndex: lineForError
    };
  }

  return result;
}

function cleanSQL(sql: string): string {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const prevChar = i > 0 ? sql[i - 1] : '';

    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
      }
    }

    if (char === ';' && !inQuotes) {
      if (current.trim()) {
        statements.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements.filter((stmt) => stmt.length > 0);
}

function isCreateTableStatement(statement: string): boolean {
  return /^\s*create\s+(temporary\s+)?table\s+(if\s+not\s+exists\s+)?/i.test(statement);
}

function parseCreateTable(ast: any, index: number, resetPositions: boolean = false): Table | null {
  const tableInfo = ast;

  if (!tableInfo || tableInfo.type !== 'create') return null;

  const tableName = extractTableName(tableInfo.table);
  if (!tableName) return null;

  const columns: Column[] = [];
  const foreignKeys: Array<{ column: string; refTable: string; refColumn: string }> = [];

  const definitions = tableInfo.create_definitions || tableInfo.def || [];

  for (const def of definitions) {
    if (def.resource === 'column' && !def.reference_definition) {
      const column = parseColumnDefinition(def);
      if (column) {
        columns.push(column);
      }
    } else if (def.resource === 'constraint' || def.reference_definition) {
      if (
        def.constraint_type === 'FOREIGN KEY' ||
        (def.reference_definition &&
          def.reference_definition.keyword &&
          def.reference_definition.keyword === 'references')
      ) {
        const fk = parseForeignKeyConstraint(def);
        if (fk) {
          foreignKeys.push(fk);

          if (!columns.find((col) => col.name === fk.column)) {
            const column = parseColumnDefinition(def);
            if (column) {
              columns.push(column);
            }
          }
        }
      }
    }
  }

  for (const fk of foreignKeys) {
    const column = columns.find((col) => col.name === fk.column);
    const isValid = tables.some(
      (t) =>
        t.name.toLowerCase() === fk.refTable.toLowerCase() &&
        t.columns.some((c) => c.name.toLowerCase() === fk.refColumn.toLowerCase())
    );

    if (column && isValid) {
      column.foreignKey = {
        table: fk.refTable,
        column: fk.refColumn
      };
    }
  }

  let position;
  const existingTable = get(schema).tables.find(
    (t) => t.name.toLowerCase() === tableName.toLowerCase()
  );
  if (resetPositions) position = calculateDynamicPosition(tableName, foreignKeys, index);
  else if (existingTable) position = existingTable.position;
  else position = calculateDynamicPosition(tableName, foreignKeys, index);

  return {
    name: tableName,
    columns,
    position
  };
}

function calculateDynamicPosition(
  tableName: string,
  foreignKeys: Array<{ column: string; refTable: string; refColumn: string }>,
  index: number
): { x: number; y: number } {
  const tableWidth = 320;
  const tableHeight = 280;
  const minSpacing = 350;
  const centerOffset = 150;

  if (tables.length === 0) {
    return { x: centerOffset, y: centerOffset };
  }

  if (foreignKeys.length > 0) {
    const relatedTables = tables.filter((t) =>
      foreignKeys.some((fk) => fk.refTable.toLowerCase() === t.name.toLowerCase())
    );

    if (relatedTables.length > 0) {
      const centerX =
        relatedTables.reduce((sum, t) => sum + t.position.x, 0) / relatedTables.length;
      const centerY =
        relatedTables.reduce((sum, t) => sum + t.position.y, 0) / relatedTables.length;

      const position = findBestPositionNear(centerX, centerY, tableWidth, tableHeight, minSpacing);
      if (position) return position;
    }
  }

  const isJunctionTable =
    foreignKeys.length >= 2 &&
    (tableName.includes('_') ||
      tableName.toLowerCase().includes('junction') ||
      tableName.toLowerCase().includes('bridge') ||
      tableName.toLowerCase().includes('link') ||
      tableName.toLowerCase().includes('rel'));

  if (isJunctionTable && foreignKeys.length >= 2) {
    const table1 = tables.find(
      (t) => t.name.toLowerCase() === foreignKeys[0].refTable.toLowerCase()
    );
    const table2 = tables.find(
      (t) => t.name.toLowerCase() === foreignKeys[1].refTable.toLowerCase()
    );

    if (table1 && table2) {
      const midX = (table1.position.x + table2.position.x) / 2;
      const midY = (table1.position.y + table2.position.y) / 2;

      const angle = Math.atan2(
        table2.position.y - table1.position.y,
        table2.position.x - table1.position.x
      );
      const perpAngle = angle + Math.PI / 2;
      const offsetDistance = minSpacing * 0.6;

      const offsetX = Math.cos(perpAngle) * offsetDistance;
      const offsetY = Math.sin(perpAngle) * offsetDistance;

      const position = findBestPositionNear(
        midX + offsetX,
        midY + offsetY,
        tableWidth,
        tableHeight,
        minSpacing
      );
      if (position) return position;
    }
  }

  return findSpiralPosition(index, tableWidth, tableHeight, minSpacing);
}

function findBestPositionNear(
  targetX: number,
  targetY: number,
  width: number,
  height: number,
  minSpacing: number
): { x: number; y: number } | null {
  const candidates = [];
  const baseRadius = minSpacing * 0.8;

  const preferredAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  for (const angle of preferredAngles) {
    const rad = (angle * Math.PI) / 180;
    const x = targetX + Math.cos(rad) * baseRadius;
    const y = targetY + Math.sin(rad) * baseRadius;

    if (!isPositionOccupied(x, y, width, height, minSpacing * 0.8)) {
      candidates.push({
        x,
        y,
        distance: Math.sqrt(Math.pow(x - targetX, 2) + Math.pow(y - targetY, 2)),
        angle
      });
    }
  }

  if (candidates.length === 0) {
    for (let r = minSpacing; r <= minSpacing * 2.5; r += minSpacing * 0.3) {
      for (let angle = 0; angle < 360; angle += 30) {
        const rad = (angle * Math.PI) / 180;
        const x = targetX + Math.cos(rad) * r;
        const y = targetY + Math.sin(rad) * r;

        if (!isPositionOccupied(x, y, width, height, minSpacing * 0.7)) {
          candidates.push({ x, y, distance: r, angle });
        }
      }
      if (candidates.length > 0) break;
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      const aIsCardinal = a.angle % 90 === 0;
      const bIsCardinal = b.angle % 90 === 0;

      if (aIsCardinal && !bIsCardinal) return -1;
      if (!aIsCardinal && bIsCardinal) return 1;

      return a.distance - b.distance;
    });

    return { x: candidates[0].x, y: candidates[0].y };
  }

  return null;
}

function findSpiralPosition(
  index: number,
  width: number,
  height: number,
  minSpacing: number
): { x: number; y: number } {
  let radius = minSpacing * 0.6;
  let angle = 0;
  const angleStep = Math.PI / 6;
  const radiusGrowth = minSpacing / 12;
  const centerX = 200;
  const centerY = 200;

  while (radius < minSpacing * 8) {
    const x = Math.cos(angle) * radius + centerX;
    const y = Math.sin(angle) * radius + centerY;

    if (!isPositionOccupied(x, y, width, height, minSpacing * 0.8)) {
      return { x, y };
    }

    angle += angleStep;
    radius += radiusGrowth;

    if (angle > Math.PI * 2) {
      angle = 0;
      radius += minSpacing * 0.4;
    }
  }

  const gridCols = Math.ceil(Math.sqrt(tables.length + 1));
  const col = index % gridCols;
  const row = Math.floor(index / gridCols);

  const gridSpacing = minSpacing * 1.2;
  const gridOffsetX = 150;
  const gridOffsetY = 150;

  return {
    x: col * gridSpacing + gridOffsetX,
    y: row * gridSpacing + gridOffsetY
  };
}

function isPositionOccupied(
  x: number,
  y: number,
  width: number,
  height: number,
  minSpacing: number
): boolean {
  const tableWidth = 320;
  const tableHeight = 280;

  for (const table of tables) {
    const newLeft = x - minSpacing / 2;
    const newRight = x + width + minSpacing / 2;
    const newTop = y - minSpacing / 2;
    const newBottom = y + height + minSpacing / 2;

    const existingLeft = table.position.x - minSpacing / 2;
    const existingRight = table.position.x + tableWidth + minSpacing / 2;
    const existingTop = table.position.y - minSpacing / 2;
    const existingBottom = table.position.y + tableHeight + minSpacing / 2;

    if (
      newLeft < existingRight &&
      newRight > existingLeft &&
      newTop < existingBottom &&
      newBottom > existingTop
    ) {
      return true;
    }
  }
  return false;
}

function extractTableName(tableInfo: any): string | null {
  return tableInfo[0].table;
}

function parseColumnDefinition(def: any): Column | null {
  let columnName: any = '';
  if (typeof def.column === 'string') {
    columnName = def.column;
  } else if (def.column && def.column.column) {
    columnName = def.column.column;
  } else if (def.column && def.column.expr) {
    columnName = def.column.value;
  } else if (def.name) {
    columnName = def.name;
  }

  if (typeof columnName !== 'string') columnName = columnName.expr.value || '';

  if (!columnName) return null;

  const definition = def.definition || def.def || {};

  const column: Column = {
    name: columnName,
    type: extractDataType(definition),
    nullable: !def.nullable,
    primaryKey: def.primary_key,
    autoIncrement: def.auto_increment,
    unique: def.unique
  };

  const defaultValue = extractDefaultValue(definition);
  if (defaultValue !== null) column.defaultValue = defaultValue;

  const foreignKey = extractColumnForeignKey(definition);
  if (foreignKey) column.foreignKey = foreignKey;

  return column;
}

function extractDataType(definition: any): string {
  if (!definition) return 'UNKNOWN';

  let type = definition.dataType || definition.type;

  if (!type) return 'UNKNOWN';

  if (typeof type === 'object') {
    if (type.type) type = type.type;
    else if (type.dataType) type = type.dataType;
  }

  const length = definition.length || definition.size;
  if (length) {
    if (Array.isArray(length)) type += `(${length.join(',')})`;
    else type += `(${length})`;
  }

  return type.toString().toUpperCase();
}

function extractDefaultValue(definition: any): string | null {
  if (!definition || !definition.suffix) return null;

  for (const suffix of definition.suffix) {
    if (suffix.type === 'DEFAULT' || suffix.keyword === 'DEFAULT') {
      return suffix.value ? suffix.value.toString() : null;
    }
  }
  return null;
}

function extractColumnForeignKey(definition: any): { table: string; column: string } | null {
  if (!definition || !definition.suffix) return null;

  for (const suffix of definition.suffix) {
    if (suffix.type === 'REFERENCES') {
      return {
        table: suffix.table,
        column: suffix.column || 'id'
      };
    }
  }
  return null;
}

function parseForeignKeyConstraint(
  def: any
): { column: string; refTable: string; refColumn: string } | null {
  if (!def.definition) return null;

  let column = def?.definition[0]?.column ?? def?.column?.column?.expr?.value;

  if (typeof column !== 'string') {
    column = column.expr ? column.expr.value : '';
  }

  const refTable = def.reference_definition.table[0].table;
  let refColumn =
    def.reference_definition.definition[0].column ||
    def.reference_definition.definition[0].column.expr.value;

  if (typeof refColumn !== 'string') refColumn = refColumn.expr ? refColumn.expr.value : '';

  if (column) {
    return {
      column,
      refTable,
      refColumn
    };
  }

  return null;
}

function extractRelationships(tables: Table[], relationships: Relationship[]): void {
  let relationshipId = 0;

  const junctionTables = detectJunctionTables(tables);

  for (const table of tables) {
    if (junctionTables.includes(table.name)) {
      const foreignKeys = table.columns.filter((col) => col.foreignKey);
      if (foreignKeys.length >= 2) {
        const table1 = foreignKeys[0].foreignKey!.table;
        const table2 = foreignKeys[1].foreignKey!.table;

        if (table1 !== table2) {
          relationships.push({
            id: `rel_${relationshipId++}`,
            fromTable: table1,
            fromColumn: foreignKeys[0].foreignKey!.column,
            toTable: table2,
            toColumn: foreignKeys[1].foreignKey!.column,
            type: 'many-to-many',
            junctionTable: table.name
          });
        }
      }
    } else {
      for (const column of table.columns) {
        if (column.foreignKey) {
          const targetTable = tables.find((t) => t.name === column.foreignKey!.table);
          if (targetTable) {
            const relationshipType = determineRelationshipType(table, column, targetTable);

            relationships.push({
              id: `rel_${relationshipId++}`,
              fromTable: table.name,
              fromColumn: column.name,
              toTable: column.foreignKey.table,
              toColumn: column.foreignKey.column,
              type: relationshipType
            });
          }
        }
      }
    }
  }
}

function detectJunctionTables(tables: Table[]): string[] {
  const junctionTables: string[] = [];

  for (const table of tables) {
    const foreignKeys = table.columns.filter((col) => col.foreignKey);
    const nonForeignKeys = table.columns.filter((col) => !col.foreignKey && !col.primaryKey);

    if (
      foreignKeys.length >= 2 &&
      nonForeignKeys.length <= 2 &&
      (table.name.includes('_') ||
        table.name.toLowerCase().includes('junction') ||
        table.name.toLowerCase().includes('bridge') ||
        table.name.toLowerCase().includes('link'))
    ) {
      junctionTables.push(table.name);
    }
  }

  return junctionTables;
}

function determineRelationshipType(
  fromTable: Table,
  column: Column,
  targetTable: Table
): 'one-to-one' | 'one-to-many' {
  if (column.unique || column.primaryKey) {
    return 'one-to-one';
  }

  const inverseForeignKey = targetTable.columns.find(
    (col) => col.foreignKey?.table === fromTable.name && (col.unique || col.primaryKey)
  );

  if (inverseForeignKey) {
    return 'one-to-one';
  }

  return 'one-to-many';
}
