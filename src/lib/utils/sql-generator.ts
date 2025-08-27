import { SQLDialect, type Table } from '$lib/types';
import { canHaveLength, isFeatureSupported } from './validators';

export function generateSQLFromSchema(visualTables: Table[], selectedDialect: SQLDialect): string {
  let sql = '';

  for (const table of visualTables) {
    sql += `CREATE TABLE ${table.name} (\n`;

    const columnDefs: string[] = [];

    for (const column of table.columns) {
      let columnDef = `  ${column.name} ${column.type}`;

      if (column.length && canHaveLength(column.type, selectedDialect)) {
        columnDef += `(${column.length})`;
      }

      if (column.primaryKey) {
        columnDef += ' PRIMARY KEY';
      }

      if (column.autoIncrement && isFeatureSupported('autoIncrement', selectedDialect)) {
        if (selectedDialect === SQLDialect.MYSQL || selectedDialect === SQLDialect.MARIADB) {
          columnDef += ' AUTO_INCREMENT';
        } else if (selectedDialect === SQLDialect.SQLITE) {
          columnDef += ' AUTOINCREMENT';
        }
      }

      if (!column.nullable) {
        columnDef += ' NOT NULL';
      }

      if (column.unique && !column.primaryKey) {
        columnDef += ' UNIQUE';
      }

      if (column.defaultValue) {
        columnDef += ` DEFAULT ${column.defaultValue}`;
      }

      columnDefs.push(columnDef);
    }

    for (const column of table.columns) {
      if (column.foreignKey) {
        columnDefs.push(
          `  FOREIGN KEY (${column.name}) REFERENCES ${column.foreignKey.table}(${column.foreignKey.column})`
        );
      }
    }

    sql += columnDefs.join(',\n');
    sql += '\n);\n\n';
  }

  return sql.trim();
}
