import { Injectable, signal } from '@angular/core';

export type Language = 'en' | 'th';

const DICTIONARY: Record<Language, Record<string, Record<string, string>>> = {
  en: {
    common: {
      search: 'Search',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      deleting: 'Deleting…',
      add: 'Add',
      actions: 'Actions',
      status: 'Status',
      name: 'Name',
      code: 'Code',
      description: 'Description',
      yes: 'Yes',
      no: 'No',
      loading: 'Loading…',
      export: 'Export',
      exporting: 'Exporting…',
      import: 'Import',
      dismiss: 'Dismiss',
    },
    login: {
      hint: 'Sign in with your account to manage devices and jobs.',
      username: 'Username',
      password: 'Password',
      usernameRequired: 'Username is required.',
      passwordRequired: 'Password is required.',
      submitting: 'Signing in…',
      signIn: 'Sign in',
      invalidCreds: 'Invalid username or password.',
      failed: 'Login failed.',
    },
    device: {
      title: 'Devices',
      hint: 'Manage IoT devices registered in the backend.',
      created: 'Device created.',
      updated: 'Device updated.',
      searchPlaceholder: 'Name, code, IP, MAC…',
      addDevice: 'Add device',
      colIp: 'IP',
      colMac: 'MAC',
      colVersion: 'Version',
      colCheckin: 'Last check-in',
      info: 'Info',
      humidity: 'Humidity',
      readv: 'ReadV',
      psi: 'PSI',
      jobs: 'Jobs',
      noDevices: 'No devices found.',
      confirmDelete: 'Delete device "{name}"?',
      loadError: 'Could not load devices.',
      exportError: 'Could not export devices.',
      deleteError: 'Could not delete device.',
      noExportData: 'No devices to export.',
    },
    job: {
      title: 'Jobs',
      hint: 'Scheduled tasks assigned to devices and job types.',
      created: 'Job created.',
      updated: 'Job updated.',
      searchPlaceholder: 'Name, description, job type…',
      deviceFilter: 'Device',
      addJob: 'Add job',
      colDevice: 'Device',
      colJobType: 'Job type',
      colGroup: 'Group',
      colEnabled: 'Enabled',
      colPriority: 'Priority',
      colRuntime: 'Runtime',
      colHumidity: 'Humidity %',
      colTemp: 'Temperature °C',
      colVolt: 'Voltage V',
      directRun: 'Direct run',
      running: 'Running…',
      clone: 'Clone',
      cloning: 'Cloning…',
      noJobs: 'No jobs found.',
      confirmDelete: 'Delete job "{name}"?',
      confirmClone: 'Clone job "{name}"? The copy will be created disabled.',
      confirmDirectRun: 'Direct run job "{name}" now?\n\nBypasses schedule, temperature/humidity checks, and port conditions. Runs configured pumps and GPIO immediately.',
      loadError: 'Could not load jobs.',
      exportError: 'Could not export jobs.',
      deleteError: 'Could not delete job.',
      noExportData: 'No jobs to export.',
      cloneError: 'Could not clone job.',
      directRunError: 'Could not run job.',
    },
    nav: {
      brand: 'IoT Admin',
      devices: 'Devices',
      allDevices: 'All devices',
      addDevice: 'Add device',
      importDevices: 'Import devices',
      firmwareUpload: 'Firmware upload',
      liveInfo: 'Live info',
      gpioCall: 'GPIO call',
      readv: 'ReadV',
      psi: 'PSI',
      jobs: 'Jobs',
      allJobs: 'All jobs',
      addJob: 'Add job',
      importJobs: 'Import jobs',
      jobLogs: 'Job logs',
      allJobTypes: 'All job types',
      addJobType: 'Add job type',
      allJobGroups: 'All job groups',
      addJobGroup: 'Add job group',
      tasks: 'Tasks',
      users: 'Users',
      configs: 'Configurations',
      changePassword: 'Change password',
      signOut: 'Sign out',
      apiTime: 'API time',
      offline: 'Offline',
      invalidTime: 'Invalid time',
    },
  },
  th: {
    common: {
      search: 'ค้นหา',
      save: 'บันทึก',
      cancel: 'ยกเลิก',
      edit: 'แก้ไข',
      delete: 'ลบ',
      deleting: 'กำลังลบ…',
      add: 'เพิ่ม',
      actions: 'การดำเนินการ',
      status: 'สถานะ',
      name: 'ชื่อ',
      code: 'รหัส',
      description: 'คำอธิบาย',
      yes: 'ใช่',
      no: 'ไม่ใช่',
      loading: 'กำลังโหลด…',
      export: 'ส่งออก',
      exporting: 'กำลังส่งออก…',
      import: 'นำเข้า',
      dismiss: 'ปิด',
    },
    login: {
      hint: 'ลงชื่อเข้าใช้ด้วยบัญชีของคุณเพื่อจัดการอุปกรณ์และงาน',
      username: 'ชื่อผู้ใช้',
      password: 'รหัสผ่าน',
      usernameRequired: 'จำเป็นต้องกรอกชื่อผู้ใช้',
      passwordRequired: 'จำเป็นต้องกรอกรหัสผ่าน',
      submitting: 'กำลังเข้าสู่ระบบ…',
      signIn: 'เข้าสู่ระบบ',
      invalidCreds: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
      failed: 'เข้าสู่ระบบล้มเหลว',
    },
    device: {
      title: 'อุปกรณ์',
      hint: 'จัดการอุปกรณ์ IoT ที่ลงทะเบียนในระบบหลังบ้าน',
      created: 'สร้างอุปกรณ์แล้ว',
      updated: 'อัปเดตอุปกรณ์แล้ว',
      searchPlaceholder: 'ชื่อ, รหัส, IP, MAC…',
      addDevice: 'เพิ่มอุปกรณ์',
      colIp: 'IP',
      colMac: 'MAC',
      colVersion: 'เวอร์ชัน',
      colCheckin: 'การเช็คอินล่าสุด',
      info: 'ข้อมูล',
      humidity: 'ความชื้น',
      readv: 'ค่าการอ่าน',
      psi: 'แรงดัน (PSI)',
      jobs: 'งาน',
      noDevices: 'ไม่พบอุปกรณ์',
      confirmDelete: 'ต้องการลบอุปกรณ์ "{name}" หรือไม่?',
      loadError: 'ไม่สามารถโหลดอุปกรณ์ได้',
      exportError: 'ไม่สามารถส่งออกอุปกรณ์ได้',
      deleteError: 'ไม่สามารถลบอุปกรณ์ได้',
      noExportData: 'ไม่มีข้อมูลอุปกรณ์ที่จะส่งออก',
    },
    job: {
      title: 'งาน',
      hint: 'งานที่ตั้งเวลาซึ่งมอบหมายให้แก่อุปกรณ์และประเภทงาน',
      created: 'สร้างงานแล้ว',
      updated: 'อัปเดตงานแล้ว',
      searchPlaceholder: 'ชื่อ, คำอธิบาย, ประเภทงาน…',
      deviceFilter: 'อุปกรณ์',
      addJob: 'เพิ่มงาน',
      colDevice: 'อุปกรณ์',
      colJobType: 'ประเภทงาน',
      colGroup: 'กลุ่ม',
      colEnabled: 'เปิดใช้งาน',
      colPriority: 'ลำดับความสำคัญ',
      colRuntime: 'เวลาทำงาน',
      colHumidity: 'ความชื้น %',
      colTemp: 'อุณหภูมิ °C',
      colVolt: 'แรงดันไฟฟ้า V',
      directRun: 'สั่งรันโดยตรง',
      running: 'กำลังรัน…',
      clone: 'คัดลอก',
      cloning: 'กำลังคัดลอก…',
      noJobs: 'ไม่พบงาน',
      confirmDelete: 'ต้องการลบงาน "{name}" หรือไม่?',
      confirmClone: 'ต้องการคัดลอกงาน "{name}" หรือไม่? งานที่คัดลอกจะถูกตั้งค่าปิดการใช้งานเริ่มต้น',
      confirmDirectRun: 'ต้องการสั่งรันงาน "{name}" ตอนนี้เลยหรือไม่?\n\nจะข้ามขั้นตอนเวลาที่กำหนด, การตรวจสอบอุณหภูมิ/ความชื้น และเงื่อนไขพอร์ตต่างๆ โดยจะสั่งรันปั๊มและ GPIO ที่กำหนดไว้ทันที',
      loadError: 'ไม่สามารถโหลดงานได้',
      exportError: 'ไม่สามารถส่งออกงานได้',
      deleteError: 'ไม่สามารถลบงานได้',
      noExportData: 'ไม่มีข้อมูลงานที่จะส่งออก',
      cloneError: 'ไม่สามารถคัดลอกงานได้',
      directRunError: 'ไม่สามารถสั่งรันงานได้',
    },
    nav: {
      brand: 'ผู้ดูแลระบบ IoT',
      devices: 'อุปกรณ์',
      allDevices: 'อุปกรณ์ทั้งหมด',
      addDevice: 'เพิ่มอุปกรณ์',
      importDevices: 'นำเข้าอุปกรณ์',
      firmwareUpload: 'อัปโหลดเฟิร์มแวร์',
      liveInfo: 'ข้อมูลสด',
      gpioCall: 'เรียก GPIO',
      readv: 'ค่าการอ่าน',
      psi: 'แรงดัน (PSI)',
      jobs: 'งาน',
      allJobs: 'งานทั้งหมด',
      addJob: 'เพิ่มงาน',
      importJobs: 'นำเข้างาน',
      jobLogs: 'บันทึกงาน',
      allJobTypes: 'ประเภทงานทั้งหมด',
      addJobType: 'เพิ่มประเภทงาน',
      allJobGroups: 'กลุ่มงานทั้งหมด',
      addJobGroup: 'เพิ่มกลุ่มงาน',
      tasks: 'งานระบบ',
      users: 'ผู้ใช้งาน',
      configs: 'ตั้งค่าระบบ',
      changePassword: 'เปลี่ยนรหัสผ่าน',
      signOut: 'ออกจากระบบ',
      apiTime: 'เวลา API',
      offline: 'ออฟไลน์',
      invalidTime: 'เวลาไม่ถูกต้อง',
    },
  },
};

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly STORAGE_KEY = 'iot_admin_lang';
  readonly lang = signal<Language>(this.detectLanguage());

  private detectLanguage(): Language {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(this.STORAGE_KEY) as Language | null;
      if (saved === 'en' || saved === 'th') {
        return saved;
      }
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('th')) {
        return 'th';
      }
    }
    return 'en';
  }

  setLanguage(lang: Language): void {
    this.lang.set(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, lang);
    }
  }

  toggleLanguage(): void {
    this.setLanguage(this.lang() === 'en' ? 'th' : 'en');
  }

  translate(key: string): string {
    const currentLang = this.lang();
    const parts = key.split('.');
    if (parts.length !== 2) {
      return key;
    }
    const [section, subkey] = parts;
    const translation = DICTIONARY[currentLang]?.[section]?.[subkey];
    return translation ?? key;
  }
}
