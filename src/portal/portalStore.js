/**
 * Private Portal Storage Layer
 * Supports local JSON persistence (for offline dev/tests) and Amazon DynamoDB (tutortime-portal).
 * Both drivers enforce identical record shapes and single-table key conventions.
 */

const fs = require('fs');
const path = require('path');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand
} = require('@aws-sdk/lib-dynamodb');

const DEFAULT_SETTINGS = {
  lateIsBillable: process.env.LATE_IS_BILLABLE !== 'false',
  replyToEmail: process.env.CASSIE_REPLY_TO_EMAIL || 'Cassie@tutortime.ai',
  senderEmail: process.env.PORTAL_SENDER_EMAIL || 'noreply@mail.tutortime.ai',
  tutorDisplayName: 'Teacher Cassie',
  defaultPricePerSession: 50,
  sendParentEmails: true,
  showProgressOnParentView: true,
  currencySymbol: '$'
};

function getLocalFilePath() {
  if (process.env.PORTAL_DATA_FILE) {
    return process.env.PORTAL_DATA_FILE;
  }
  const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../data');
  return path.join(dataDir, 'tutortime-portal.json');
}

function emptyLocalData() {
  return {
    users: {},
    sessions: {},
    students: {},
    attendance: {},
    progressNotes: {},
    emailLogs: {},
    settings: null
  };
}

function readLocalData(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    const init = emptyLocalData();
    fs.writeFileSync(filePath, JSON.stringify(init, null, 2));
    return init;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...emptyLocalData(), ...parsed };
  } catch (err) {
    console.error('[PortalLocalStore] Failed reading portal data:', err.message);
    return emptyLocalData();
  }
}

function writeLocalData(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpFile = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2));
  fs.renameSync(tmpFile, filePath);
}

class LocalPortalStore {
  getFilePath() {
    return getLocalFilePath();
  }

  async getUser(username) {
    const data = readLocalData(this.getFilePath());
    return data.users[username] || null;
  }

  async putUser(user) {
    const file = this.getFilePath();
    const data = readLocalData(file);
    data.users[user.username] = user;
    writeLocalData(file, data);
    return user;
  }

  async createSession(session) {
    const file = this.getFilePath();
    const data = readLocalData(file);
    data.sessions[session.tokenHash] = session;
    writeLocalData(file, data);
    return session;
  }

  async getSession(tokenHash) {
    const file = this.getFilePath();
    const data = readLocalData(file);
    const s = data.sessions[tokenHash];
    if (!s) return null;
    if (s.expiresAt && s.expiresAt < Math.floor(Date.now() / 1000)) {
      delete data.sessions[tokenHash];
      writeLocalData(file, data);
      return null;
    }
    return s;
  }

  async deleteSession(tokenHash) {
    const file = this.getFilePath();
    const data = readLocalData(file);
    if (data.sessions[tokenHash]) {
      delete data.sessions[tokenHash];
      writeLocalData(file, data);
    }
  }

  async getSettings() {
    const data = readLocalData(this.getFilePath());
    return { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
  }

  async saveSettings(settings) {
    const file = this.getFilePath();
    const data = readLocalData(file);
    const merged = { ...DEFAULT_SETTINGS, ...settings, updatedAt: new Date().toISOString() };
    data.settings = merged;
    writeLocalData(file, data);
    return merged;
  }

  async listStudents({ includeArchived = false } = {}) {
    const data = readLocalData(this.getFilePath());
    const all = Object.values(data.students);
    const filtered = includeArchived ? all : all.filter(s => !s.archived);
    return filtered.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }

  async getStudent(studentId) {
    const data = readLocalData(this.getFilePath());
    return data.students[studentId] || null;
  }

  async getStudentByTokenHash(tokenHash) {
    if (!tokenHash) return null;
    const data = readLocalData(this.getFilePath());
    return Object.values(data.students).find(s => s.parentTokenHash === tokenHash) || null;
  }

  async saveStudent(student) {
    const file = this.getFilePath();
    const data = readLocalData(file);
    data.students[student.studentId] = student;
    writeLocalData(file, data);
    return student;
  }

  async listAttendanceByMonth(month) {
    const data = readLocalData(this.getFilePath());
    return Object.values(data.attendance)
      .filter(r => r.month === month)
      .sort((a, b) => `${a.date}#${a.studentId}`.localeCompare(`${b.date}#${b.studentId}`));
  }

  async getAttendance(month, date, studentId) {
    const data = readLocalData(this.getFilePath());
    return data.attendance[`${date}#${studentId}`] || null;
  }

  async putAttendance(record) {
    const file = this.getFilePath();
    const data = readLocalData(file);
    data.attendance[`${record.date}#${record.studentId}`] = record;
    writeLocalData(file, data);
    return record;
  }

  async deleteAttendance(month, date, studentId) {
    const file = this.getFilePath();
    const data = readLocalData(file);
    const key = `${date}#${studentId}`;
    if (data.attendance[key]) {
      delete data.attendance[key];
      writeLocalData(file, data);
      return true;
    }
    return false;
  }

  async logEmail(entry) {
    const file = this.getFilePath();
    const data = readLocalData(file);
    const key = `${entry.createdAt}#${entry.logId}`;
    data.emailLogs[key] = entry;
    writeLocalData(file, data);
    return entry;
  }

  async listEmailLogs(month) {
    const data = readLocalData(this.getFilePath());
    return Object.values(data.emailLogs)
      .filter(e => !month || e.month === month)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  async listProgressNotes(studentId) {
    const data = readLocalData(this.getFilePath());
    return Object.values(data.progressNotes || {})
      .filter(n => n.studentId === studentId)
      .sort((a, b) => `${b.date}#${b.createdAt}`.localeCompare(`${a.date}#${a.createdAt}`));
  }

  async putProgressNote(note) {
    const file = this.getFilePath();
    const data = readLocalData(file);
    if (!data.progressNotes) data.progressNotes = {};
    data.progressNotes[`${note.studentId}#${note.date}#${note.noteId}`] = note;
    writeLocalData(file, data);
    return note;
  }

  async deleteProgressNote(studentId, date, noteId) {
    const file = this.getFilePath();
    const data = readLocalData(file);
    const key = `${studentId}#${date}#${noteId}`;
    if (data.progressNotes && data.progressNotes[key]) {
      delete data.progressNotes[key];
      writeLocalData(file, data);
      return true;
    }
    return false;
  }
}

class AwsPortalStore {
  constructor(options = {}) {
    this.region = options.region || process.env.AWS_REGION || 'us-east-2';
    this.tableName = options.tableName || process.env.PORTAL_TABLE_NAME || 'tutortime-portal';
    const client = options.dynamoClient || new DynamoDBClient({ region: this.region });
    this.docClient = options.docClient || DynamoDBDocumentClient.from(client);
  }

  async getUser(username) {
    const res = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: `USER#${username}`, SK: 'PROFILE' }
    }));
    return res.Item || null;
  }

  async putUser(user) {
    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: { PK: `USER#${user.username}`, SK: 'PROFILE', entityType: 'USER', ...user }
    }));
    return user;
  }

  async createSession(session) {
    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: { PK: `SESSION#${session.tokenHash}`, SK: 'SESSION', entityType: 'SESSION', ...session }
    }));
    return session;
  }

  async getSession(tokenHash) {
    const res = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: `SESSION#${tokenHash}`, SK: 'SESSION' }
    }));
    const item = res.Item;
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < Math.floor(Date.now() / 1000)) {
      await this.deleteSession(tokenHash);
      return null;
    }
    return item;
  }

  async deleteSession(tokenHash) {
    await this.docClient.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { PK: `SESSION#${tokenHash}`, SK: 'SESSION' }
    }));
  }

  async getSettings() {
    const res = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: 'SETTINGS#GLOBAL', SK: 'CONFIG' }
    }));
    return { ...DEFAULT_SETTINGS, ...(res.Item || {}) };
  }

  async saveSettings(settings) {
    const merged = {
      ...DEFAULT_SETTINGS,
      ...settings,
      updatedAt: new Date().toISOString()
    };
    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: { PK: 'SETTINGS#GLOBAL', SK: 'CONFIG', entityType: 'SETTINGS', ...merged }
    }));
    return merged;
  }

  async listStudents({ includeArchived = false } = {}) {
    const res = await this.docClient.send(new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'entityType = :et',
      ExpressionAttributeValues: { ':et': 'STUDENT' }
    }));
    const items = res.Items || [];
    const filtered = includeArchived ? items : items.filter(s => !s.archived);
    return filtered.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }

  async getStudent(studentId) {
    const res = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: `STUDENT#${studentId}`, SK: 'PROFILE' }
    }));
    return res.Item || null;
  }

  async getStudentByTokenHash(tokenHash) {
    if (!tokenHash) return null;
    const res = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `TOKEN#${tokenHash}`,
        ':sk': 'STUDENT'
      },
      Limit: 1
    }));
    return (res.Items && res.Items[0]) || null;
  }

  async saveStudent(student) {
    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `STUDENT#${student.studentId}`,
        SK: 'PROFILE',
        GSI1PK: `TOKEN#${student.parentTokenHash}`,
        GSI1SK: 'STUDENT',
        entityType: 'STUDENT',
        ...student
      }
    }));
    return student;
  }

  async listAttendanceByMonth(month) {
    const res = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': `ATTENDANCE#${month}` }
    }));
    return (res.Items || []).sort((a, b) => `${a.date}#${a.studentId}`.localeCompare(`${b.date}#${b.studentId}`));
  }

  async getAttendance(month, date, studentId) {
    const res = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { PK: `ATTENDANCE#${month}`, SK: `${date}#${studentId}` }
    }));
    return res.Item || null;
  }

  async putAttendance(record) {
    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `ATTENDANCE#${record.month}`,
        SK: `${record.date}#${record.studentId}`,
        entityType: 'ATTENDANCE',
        ...record
      }
    }));
    return record;
  }

  async deleteAttendance(month, date, studentId) {
    await this.docClient.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { PK: `ATTENDANCE#${month}`, SK: `${date}#${studentId}` }
    }));
    return true;
  }

  async logEmail(entry) {
    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `EMAILLOG#${entry.month}`,
        SK: `${entry.createdAt}#${entry.logId}`,
        entityType: 'EMAILLOG',
        ...entry
      }
    }));
    return entry;
  }

  async listEmailLogs(month) {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const res = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': `EMAILLOG#${targetMonth}` },
      ScanIndexForward: false
    }));
    return res.Items || [];
  }

  async listProgressNotes(studentId) {
    const res = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': `PROGRESS#${studentId}` },
      ScanIndexForward: false
    }));
    return res.Items || [];
  }

  async putProgressNote(note) {
    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `PROGRESS#${note.studentId}`,
        SK: `${note.date}#${note.noteId}`,
        entityType: 'PROGRESS',
        ...note
      }
    }));
    return note;
  }

  async deleteProgressNote(studentId, date, noteId) {
    await this.docClient.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { PK: `PROGRESS#${studentId}`, SK: `${date}#${noteId}` }
    }));
    return true;
  }
}

const localInstance = new LocalPortalStore();
let awsInstance = null;

function getPortalStore() {
  const driver = (process.env.STORAGE_DRIVER || 'local').toLowerCase().trim();
  if (driver === 'aws') {
    if (!awsInstance) {
      awsInstance = new AwsPortalStore();
    }
    return awsInstance;
  }
  return localInstance;
}

module.exports = {
  getPortalStore,
  LocalPortalStore,
  AwsPortalStore,
  DEFAULT_SETTINGS
};
