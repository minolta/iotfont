/** User-facing guide for built-in job type names (matches backend JobWorkerFactory). */
export interface JobTypeGuide {
  /** Short summary shown under the job type selector. */
  summary: string;
  /** How the job runs on the backend. */
  howItWorks: string;
  /** Fields the user should configure for this job type. */
  requiredFields: string[];
  /** Optional fields that affect behavior. */
  optionalFields: string[];
  /** Description field syntax (portjob, solar, solarcheck). */
  descriptionOptions?: string[];
  /** Example description values. */
  descriptionExamples?: string[];
}

const GUIDES: Record<string, JobTypeGuide> = {
  humidity: {
    summary: 'อ่านความชื้นจาก sensor แล้วสั่ง GPIO เมื่อค่าอยู่ในช่วงที่กำหนด',
    howItWorks:
      'ตรวจเวลา (start/end date, daily time) → อ่าน sensor ที่เปิดใช้ → ถ้าความชื้นอยู่ระหว่าง Min–Max จะรัน GPIO ports ที่ตั้งไว้ มิฉะนั้นข้าม',
    requiredFields: ['Device', 'Sensors (อย่างน้อย 1 ตัวที่ Enabled)'],
    optionalFields: [
      'Min/Max humidity (%) — ว่าง = รับทุกค่า',
      'GPIO ports — อุปกรณ์, พอร์ต, Logic High/Low, Runtime, Wait time',
      'Runtime / Wait time ของ job',
      'Start/End date, Daily start/end time',
      'Job group, Priority',
    ],
  },
  runhbyd1: {
    summary: 'เหมือน humidity (ชื่อ legacy)',
    howItWorks: 'ทำงานเหมือน job type humidity — อ่านความชื้นแล้วควบคุม GPIO ตามช่วง hlow/hhigh',
    requiredFields: ['Device', 'Sensors (อย่างน้อย 1 ตัวที่ Enabled)'],
    optionalFields: [
      'Min/Max humidity (%)',
      'GPIO ports',
      'Runtime / Wait time, ช่วงเวลารัน',
      'Job group, Priority',
    ],
  },
  readhumidity: {
    summary: 'เหมือน humidity (ชื่อ legacy)',
    howItWorks: 'ทำงานเหมือน job type humidity — อ่านความชื้นแล้วควบคุม GPIO ตามช่วง hlow/hhigh',
    requiredFields: ['Device', 'Sensors (อย่างน้อย 1 ตัวที่ Enabled)'],
    optionalFields: [
      'Min/Max humidity (%)',
      'GPIO ports',
      'Runtime / Wait time, ช่วงเวลารัน',
      'Job group, Priority',
    ],
  },
  readht: {
    summary: 'อ่านและบันทึกค่าความชื้น / อุณหภูมิจาก sensor (ไม่สั่ง GPIO อัตโนมัติ)',
    howItWorks:
      'ตรวจเวลา → อ่าน sensor แต่ละตัวผ่าน HTTP (read path) → บันทึกค่า h, t ลงระบบ แล้วรอรอบถัดไป',
    requiredFields: ['Device'],
    optionalFields: [
      'Sensors — ถ้าไม่ใส่จะอ่านจาก device ของ job ที่ path /',
      'Sensor type: humidity, Read path เช่น / หรือ /status',
      'ช่วงเวลารัน (date/time)',
    ],
  },
  'readh/t': {
    summary: 'เหมือน readht',
    howItWorks: 'ทำงานเหมือน readht — อ่านและบันทึกความชื้น/อุณหภูมิ',
    requiredFields: ['Device'],
    optionalFields: ['Sensors', 'ช่วงเวลารัน'],
  },
  readv: {
    summary: 'อ่านและบันทึกแรงดัน / กระแส / กำลัง (v, i, p) จาก sensor',
    howItWorks:
      'ตรวจเวลา → อ่าน sensor ประเภท volt → บันทึกค่า v, i, p แล้วรอรอบถัดไป',
    requiredFields: ['Device'],
    optionalFields: [
      'Sensors ประเภท volt — ถ้าไม่ใส่จะอ่านจาก device ของ job ที่ path /',
      'Read path บนอุปกรณ์',
      'ช่วงเวลารัน',
    ],
  },
  tempwork: {
    summary: 'อ่านอุณหภูมิจาก sensor แล้วสั่ง GPIO เมื่อค่าอยู่ในช่วงที่กำหนด',
    howItWorks:
      'ตรวจเวลา → อ่านอุณหภูมิจาก sensor → ถ้าอยู่ระหว่าง Min–Max จะรัน GPIO ports มิฉะนั้นข้าม',
    requiredFields: ['Device'],
    optionalFields: [
      'Min/Max temperature (°C) — ว่าง = รับทุกค่า',
      'Sensors — ถ้าไม่ใส่จะอ่านจาก device ของ job',
      'GPIO ports',
      'Runtime / Wait time, ช่วงเวลารัน',
    ],
  },
  temperature: {
    summary: 'job ทั่วไป (ชื่อ legacy) — อ่าน sensor และรัน ports ตามที่ตั้งไว้',
    howItWorks:
      'รัน sensor และ GPIO ที่เปิดใช้ตามลำดับ ไม่มีเงื่อนไขความชื้น/อุณหภูมิแบบ tempwork',
    requiredFields: ['Device'],
    optionalFields: ['Sensors', 'GPIO ports', 'Runtime / Wait time'],
  },
  portjob: {
    summary: 'อ่านสถานะ port ของ device แล้วสั่ง GPIO เมื่อเงื่อนไขใน Description ตรง',
    howItWorks:
      'ตรวจเวลา → อ่านสถานะ port จาก device → ถ้าตรงเงื่อนไขใน Description จะรัน GPIO ports ที่ตั้งไว้',
    requiredFields: ['Device', 'Description (รูปแบบ port condition)', 'GPIO ports ที่จะสั่ง'],
    optionalFields: ['Runtime / Wait time ของแต่ละ port', 'ช่วงเวลารัน'],
    descriptionOptions: [
      'port,<ชื่อพอร์ต>,<ค่า> — เช่น port,D6,0 หรือ port,fastport,0',
      'port,<ชื่อ>,<ค่า>|<config> — เช่น port,D6,0|PALAlle',
      'รูปแบบเก่า: D6,0 หรือ D6|0 หรือ D6:low',
      'ค่า logic: 0/1, low/high, on/off',
    ],
    descriptionExamples: ['port,D6,0', 'port,fastport,0|PALAlle', 'D6,0'],
  },
  solarcheck: {
    summary: 'ตรวจสถานะ solar แล้วบอก job ประเภท solar ว่ารันได้หรือไม่',
    howItWorks:
      'อ่าน epp/epn จาก device → คำนวณ status = (epp − epn) + diff → ถ้า status > rang จะตั้ง solarCanRun=true ให้ job solar ใช้',
    requiredFields: ['Device', 'Description หรือ Min humidity (rang) + Min temperature (diff)'],
    optionalFields: [
      'readv,<device_id> หรือ vbatt,<device_id> — แสดงค่าแรงดันใน status',
      'ช่วงเวลารัน',
    ],
    descriptionOptions: [
      'diff,<offset> — ชดเชยค่า diff (หรือใช้ Min temperature แทน)',
      'rang,<threshold> — เกณฑ์เปรียบเทียบ (หรือใช้ Min humidity แทน)',
      'readv,<device_id> / vbatt,<device_id> — อ้างอิง device อ่านแรงดัน',
    ],
    descriptionExamples: ['diff,-590|rang,200', 'diff,0|rang,150|readv,2'],
  },
  solar: {
    summary: 'สั่ง GPIO เมื่อ solarcheck อนุญาต และสถานะ port ตรงเงื่อนไข',
    howItWorks:
      'ตรวจ notrun (วันที่ไม่รัน) → ตรวจ solarCanRun จาก solarcheck → อ่าน port จาก sensor → ถ้าตรงเงื่อนไขใน Description จะรัน GPIO',
    requiredFields: [
      'Device',
      'job solarcheck ที่ทำงานอยู่',
      'Description (port condition)',
      'GPIO ports',
    ],
    optionalFields: [
      'Sensors — อ่าน port status จาก HTTP path ของอุปกรณ์',
      'notrun,<วันที่> — วันที่ 1–31 ที่ไม่รัน',
    ],
    descriptionOptions: [
      'port,<ชื่อ>,<ค่า> — เงื่อนไข port เหมือน portjob',
      'notrun,<วัน1>,<วัน2>,… — ข้าม job ในวันที่กำหนดของเดือน',
    ],
    descriptionExamples: ['port,fastport,0', 'port,D6,0|notrun,10,11,12'],
  },
};

const DEFAULT_GUIDE: JobTypeGuide = {
  summary: 'Job ทั่วไป — อ่าน sensors และรัน GPIO ports ตามที่ตั้งไว้',
  howItWorks:
    'อ่าน sensor ที่เปิดใช้ (ถ้ามี) แล้วรัน GPIO ports ที่เปิดใช้ ไม่มีเงื่อนไขพิเศษจาก backend',
  requiredFields: ['Device'],
  optionalFields: ['Sensors', 'GPIO ports', 'Runtime / Wait time', 'ช่วงเวลารัน'],
};

export function normalizeJobTypeName(name: string | null | undefined): string {
  return (name ?? '').trim().toLowerCase();
}

export function getJobTypeGuide(name: string | null | undefined): JobTypeGuide {
  const key = normalizeJobTypeName(name);
  if (!key) {
    return DEFAULT_GUIDE;
  }
  return GUIDES[key] ?? DEFAULT_GUIDE;
}

export function jobTypeUsesHumidityRange(name: string | null | undefined): boolean {
  const key = normalizeJobTypeName(name);
  return key === 'humidity' || key === 'runhbyd1' || key === 'readhumidity';
}

export function jobTypeUsesTemperatureRange(name: string | null | undefined): boolean {
  const key = normalizeJobTypeName(name);
  return key === 'tempwork';
}

export function jobTypeUsesDescriptionSyntax(name: string | null | undefined): boolean {
  const key = normalizeJobTypeName(name);
  return key === 'portjob' || key === 'solarcheck' || key === 'solar';
}
