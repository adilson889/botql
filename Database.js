'use strict';

/**
* Database.js — Camada de banco de dados do BotQL
*
* Qualquer adapter aqui implementa a mesma interface, usada pelo botql.js:
*   createTable(name, columns, preventDefault)
*   insert(table, columnNames, values) -> id
*   update(table, column, value, whereColumn, whereValue)
*   getRows(table) -> array de linhas
*
* MemoryDatabase: guarda tudo em memória, sem persistência — bom para
* testes e para o exemplo do botql.js.
*
* SQLiteDatabase: persiste num ficheiro .sqlite real, usando o módulo
* nativo `node:sqlite` (Node 22+), sem dependências externas.
*/

const CONTEXT_SCHEMA = [
{ name: 'id', columnType: 'INT', constraints: ['PRIMARY', 'KEY', 'AUTO_INCREMENT'] },
{ name: 'client', columnType: 'TEXT', constraints: [] },
{ name: 'message', columnType: 'TEXT', constraints: [] },
{ name: 'reply', columnType: 'TEXT', constraints: [] },
{ name: 'created_at', columnType: 'DATETIME', constraints: [] }
];

// ===== MemoryDatabase =====

class MemoryDatabase {
constructor() {
this.tables = new Map();
this.autoIncrement = new Map();
}

createTable(name, columns, preventDefault) {
const resolvedColumns = (name === 'Context' && columns.length === 0)
? CONTEXT_SCHEMA
: columns;

if (this.tables.has(name)) {
if (preventDefault) return;
throw new Error(`runtime error: table "${name}" already exists`);
}

this.tables.set(name, { columns: resolvedColumns, rows: [] });
this.autoIncrement.set(name, 0);
}

insert(table, columnNames, values) {
const t = this.tables.get(table);
if (!t) throw new Error(`runtime error: table "${table}" does not exist`);

const nextId = this.autoIncrement.get(table) + 1;
this.autoIncrement.set(table, nextId);

const row = { id: nextId };
columnNames.forEach((col, i) => { row[col] = values[i]; });
t.rows.push(row);

return nextId;
}

update(table, column, value, whereColumn, whereValue) {
const t = this.tables.get(table);
if (!t) throw new Error(`runtime error: table "${table}" does not exist`);

const row = whereColumn
? t.rows.find((r) => r[whereColumn] === whereValue)
: t.rows[t.rows.length - 1];

if (row) row[column] = value;
return row || null;
}

getRows(table) {
const t = this.tables.get(table);
return t ? t.rows.slice() : [];
}
}

// ===== SQLiteDatabase =====

function mapColumnType(columnType) {
const type = (columnType || '').toUpperCase();
if (type === 'INT' || type === 'INTEGER') return 'INTEGER';
if (type === 'DATETIME' || type === 'DATE') return 'TEXT';
return 'TEXT';
}

function buildColumnDef(col) {
const type = mapColumnType(col.columnType);
const isPrimary = col.constraints.includes('PRIMARY') && col.constraints.includes('KEY');
const isAutoIncrement = col.constraints.includes('AUTO_INCREMENT');

let def = `${col.name} ${type}`;
if (isPrimary) def += ' PRIMARY KEY';
if (isPrimary && isAutoIncrement) def += ' AUTOINCREMENT';
return def;
}

class SQLiteDatabase {
/**
* @param {string} filePath Caminho do ficheiro .sqlite, ou ":memory:" para um banco temporário.
*/
constructor(filePath = ':memory:') {
const { DatabaseSync } = require('node:sqlite');
this.driver = new DatabaseSync(filePath);
}

createTable(name, columns, preventDefault) {
const resolvedColumns = (name === 'Context' && columns.length === 0)
? CONTEXT_SCHEMA
: columns;

const columnDefs = resolvedColumns.map(buildColumnDef).join(', ');
const ifNotExists = preventDefault ? 'IF NOT EXISTS ' : '';
this.driver.exec(`CREATE TABLE ${ifNotExists}${name} (${columnDefs})`);
}

insert(table, columnNames, values) {
const placeholders = columnNames.map(() => '?').join(', ');
const sql = `INSERT INTO ${table} (${columnNames.join(', ')}) VALUES (${placeholders})`;
const info = this.driver.prepare(sql).run(...values);
return Number(info.lastInsertRowid);
}

update(table, column, value, whereColumn, whereValue) {
if (whereColumn) {
const sql = `UPDATE ${table} SET ${column} = ? WHERE ${whereColumn} = ?`;
this.driver.prepare(sql).run(value, whereValue);
} else {
const sql = `UPDATE ${table} SET ${column} = ? WHERE id = (SELECT MAX(id) FROM ${table})`;
this.driver.prepare(sql).run(value);
}
}

getRows(table) {
return this.driver.prepare(`SELECT * FROM ${table}`).all();
}

close() {
this.driver.close();
}
}

module.exports = { MemoryDatabase, SQLiteDatabase };