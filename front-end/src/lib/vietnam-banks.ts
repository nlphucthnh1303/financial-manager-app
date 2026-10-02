/**
 * Vietnamese Banking & E-Wallets Ecosystem
 * Metadata for 25+ Vietnamese Banks & E-wallets, VietQR Generator, SMS Parser, and Vietnamese Number-to-Words
 */

export interface VietnamBank {
  id: string;
  code: string;
  name: string;
  shortName: string;
  bin: string;
  color: string;
  textColor: string;
  bgGradient: string;
  logo: string;
  type: 'bank' | 'wallet';
}

export const VIETNAM_BANKS: VietnamBank[] = [
  {
    id: 'vcb',
    code: 'VCB',
    name: 'Ngân hàng Ngoại thương Việt Nam (Vietcombank)',
    shortName: 'Vietcombank',
    bin: '970436',
    color: '#005a3c',
    textColor: '#ffffff',
    bgGradient: 'from-emerald-800 to-green-950',
    logo: '🌿',
    type: 'bank'
  },
  {
    id: 'tcb',
    code: 'TCB',
    name: 'Ngân hàng Kỹ thương Việt Nam (Techcombank)',
    shortName: 'Techcombank',
    bin: '970407',
    color: '#e31837',
    textColor: '#ffffff',
    bgGradient: 'from-red-600 to-rose-950',
    logo: '🔴',
    type: 'bank'
  },
  {
    id: 'mb',
    code: 'MB',
    name: 'Ngân hàng Quân đội (MBBank)',
    shortName: 'MB Bank',
    bin: '970422',
    color: '#002b80',
    textColor: '#ffffff',
    bgGradient: 'from-blue-700 to-indigo-950',
    logo: '⭐',
    type: 'bank'
  },
  {
    id: 'vpb',
    code: 'VPB',
    name: 'Ngân hàng Việt Nam Thịnh Vượng (VPBank)',
    shortName: 'VPBank',
    bin: '970432',
    color: '#00b14f',
    textColor: '#ffffff',
    bgGradient: 'from-emerald-600 to-teal-950',
    logo: '🌱',
    type: 'bank'
  },
  {
    id: 'bidv',
    code: 'BIDV',
    name: 'Ngân hàng Đầu tư và Phát triển Việt Nam (BIDV)',
    shortName: 'BIDV',
    bin: '970418',
    color: '#006c68',
    textColor: '#ffffff',
    bgGradient: 'from-teal-700 to-cyan-950',
    logo: '🔷',
    type: 'bank'
  },
  {
    id: 'acb',
    code: 'ACB',
    name: 'Ngân hàng Á Châu (ACB)',
    shortName: 'ACB',
    bin: '970416',
    color: '#0072bc',
    textColor: '#ffffff',
    bgGradient: 'from-sky-600 to-blue-950',
    logo: '🟦',
    type: 'bank'
  },
  {
    id: 'tpb',
    code: 'TPB',
    name: 'Ngân hàng Tiên Phong (TPBank)',
    shortName: 'TPBank',
    bin: '970423',
    color: '#5b2d82',
    textColor: '#ffffff',
    bgGradient: 'from-purple-700 to-fuchsia-950',
    logo: '💜',
    type: 'bank'
  },
  {
    id: 'vib',
    code: 'VIB',
    name: 'Ngân hàng Quốc tế Việt Nam (VIB)',
    shortName: 'VIB',
    bin: '970441',
    color: '#0054a6',
    textColor: '#ffffff',
    bgGradient: 'from-blue-600 to-sky-950',
    logo: '🌐',
    type: 'bank'
  },
  {
    id: 'stb',
    code: 'STB',
    name: 'Ngân hàng Sài Gòn Thương Tín (Sacombank)',
    shortName: 'Sacombank',
    bin: '970403',
    color: '#004c8f',
    textColor: '#ffffff',
    bgGradient: 'from-blue-800 to-indigo-950',
    logo: '💠',
    type: 'bank'
  },
  {
    id: 'vba',
    code: 'VBA',
    name: 'Ngân hàng Nông nghiệp & PT Nông thôn (Agribank)',
    shortName: 'Agribank',
    bin: '970405',
    color: '#8b1d24',
    textColor: '#ffffff',
    bgGradient: 'from-red-800 to-stone-950',
    logo: '🌾',
    type: 'bank'
  },
  {
    id: 'hdb',
    code: 'HDB',
    name: 'Ngân hàng Phát triển TP.HCM (HDBank)',
    shortName: 'HDBank',
    bin: '970437',
    color: '#e21a22',
    textColor: '#ffffff',
    bgGradient: 'from-red-600 to-amber-950',
    logo: '🏮',
    type: 'bank'
  },
  {
    id: 'msb',
    code: 'MSB',
    name: 'Ngân hàng Hàng Hải Việt Nam (MSB)',
    shortName: 'MSB',
    bin: '970426',
    color: '#eb6e00',
    textColor: '#ffffff',
    bgGradient: 'from-orange-600 to-amber-950',
    logo: '⚓',
    type: 'bank'
  },
  {
    id: 'ocb',
    code: 'OCB',
    name: 'Ngân hàng Phương Đông (OCB)',
    shortName: 'OCB',
    bin: '970448',
    color: '#008542',
    textColor: '#ffffff',
    bgGradient: 'from-emerald-700 to-green-950',
    logo: '🌻',
    type: 'bank'
  },
  {
    id: 'shb',
    code: 'SHB',
    name: 'Ngân hàng Sài Gòn - Hà Nội (SHB)',
    shortName: 'SHB',
    bin: '970443',
    color: '#f58220',
    textColor: '#ffffff',
    bgGradient: 'from-amber-600 to-orange-950',
    logo: '🏛️',
    type: 'bank'
  },
  {
    id: 'cake',
    code: 'CAKE',
    name: 'Ngân hàng số Cake by VPBank',
    shortName: 'Cake by VPBank',
    bin: '546034',
    color: '#ff2d55',
    textColor: '#ffffff',
    bgGradient: 'from-pink-600 to-rose-950',
    logo: '🍰',
    type: 'bank'
  },
  {
    id: 'timo',
    code: 'TIMO',
    name: 'Ngân hàng số Timo by BVBank',
    shortName: 'Timo',
    bin: '963388',
    color: '#8b5cf6',
    textColor: '#ffffff',
    bgGradient: 'from-purple-600 to-violet-950',
    logo: '💜',
    type: 'bank'
  },
  {
    id: 'momo',
    code: 'MOMO',
    name: 'Ví điện tử MoMo',
    shortName: 'Ví MoMo',
    bin: '970422', // mapped
    color: '#a50064',
    textColor: '#ffffff',
    bgGradient: 'from-pink-700 to-purple-950',
    logo: '👛',
    type: 'wallet'
  },
  {
    id: 'zalopay',
    code: 'ZALOPAY',
    name: 'Ví điện tử ZaloPay',
    shortName: 'ZaloPay',
    bin: '970422',
    color: '#0068ff',
    textColor: '#ffffff',
    bgGradient: 'from-blue-600 to-cyan-950',
    logo: '💬',
    type: 'wallet'
  },
  {
    id: 'viettelmoney',
    code: 'VIETTELMONEY',
    name: 'Viettel Money',
    shortName: 'Viettel Money',
    bin: '970422',
    color: '#ee0033',
    textColor: '#ffffff',
    bgGradient: 'from-red-600 to-rose-950',
    logo: '📱',
    type: 'wallet'
  },
  {
    id: 'cash',
    code: 'CASH',
    name: 'Tiền mặt tại ví / Két sắt',
    shortName: 'Tiền mặt',
    bin: '',
    color: '#059669',
    textColor: '#ffffff',
    bgGradient: 'from-emerald-700 to-teal-950',
    logo: '💵',
    type: 'wallet'
  }
];

export function findBankByKeyword(keyword: string): VietnamBank | undefined {
  if (!keyword) return undefined;
  const kw = keyword.toLowerCase().trim();
  return VIETNAM_BANKS.find(b => 
    b.code.toLowerCase() === kw || 
    b.shortName.toLowerCase().includes(kw) || 
    b.name.toLowerCase().includes(kw)
  );
}

/**
 * Generate standard VietQR quick link (using vietqr.io Napas standard image API)
 */
export function generateVietQRUrl(params: {
  bankBin: string;
  accountNumber: string;
  accountName?: string;
  amount?: number;
  memo?: string;
  template?: 'compact' | 'compact2' | 'qr_only' | 'print';
}): string {
  const { bankBin, accountNumber, accountName = '', amount = 0, memo = '', template = 'compact2' } = params;
  if (!bankBin || !accountNumber) return '';
  
  const cleanAcc = accountNumber.replace(/\s+/g, '');
  const cleanMemo = encodeURIComponent(memo || 'Chuyen tien');
  const cleanName = encodeURIComponent(accountName || '');
  const amtStr = amount > 0 ? `&amount=${Math.round(amount)}` : '';
  
  return `https://img.vietqr.io/image/${bankBin}-${cleanAcc}-${template}.png?addInfo=${cleanMemo}&accountName=${cleanName}${amtStr}`;
}

/**
 * Convert numbers into Vietnamese words representation (Đọc số tiền bằng chữ)
 * Example: 2500000 -> "Hai triệu năm trăm nghìn đồng"
 */
export function numberToVietnameseWords(n: number | string): string {
  const num = typeof n === 'string' ? parseInt(n.replace(/\D/g, ''), 10) : Math.floor(n);
  if (isNaN(num) || num === 0) return 'Không đồng';
  if (num < 0) return `Âm ${numberToVietnameseWords(-num)}`;
  if (num > 999999999999999) return 'Số tiền quá lớn';

  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

  function readThreeDigits(three: number, isLast: boolean): string {
    const h = Math.floor(three / 100);
    const t = Math.floor((three % 100) / 10);
    const u = three % 10;
    let res = '';

    if (h > 0 || !isLast) {
      res += `${digits[h]} trăm `;
    }

    if (t > 1) {
      res += `${digits[t]} mươi `;
      if (u === 1) res += 'mốt ';
      else if (u === 5) res += 'lăm ';
      else if (u > 0) res += `${digits[u]} `;
    } else if (t === 1) {
      res += 'mười ';
      if (u === 5) res += 'lăm ';
      else if (u > 0) res += `${digits[u]} `;
    } else if (t === 0 && (h > 0 || !isLast) && u > 0) {
      res += `linh ${digits[u]} `;
    } else if (u > 0 && h === 0 && isLast) {
      res += `${digits[u]} `;
    }

    return res.trim();
  }

  const chunks: number[] = [];
  let temp = num;
  while (temp > 0) {
    chunks.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const parts: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (chunk > 0) {
      const isLast = i === chunks.length - 1;
      const read = readThreeDigits(chunk, isLast);
      parts.push(`${read} ${units[i]}`.trim());
    }
  }

  const fullText = parts.join(' ').replace(/\s+/g, ' ').trim();
  const capitalized = fullText.charAt(0).toUpperCase() + fullText.slice(1);
  return `${capitalized} đồng`;
}

/**
 * Quick increment amounts for fast transaction entry in Vietnam Dong
 */
export const QUICK_AMOUNTS = [
  { label: '+10k', value: 10000 },
  { label: '+20k', value: 20000 },
  { label: '+50k', value: 50000 },
  { label: '+100k', value: 100000 },
  { label: '+200k', value: 200000 },
  { label: '+500k', value: 500000 },
  { label: '+1Tr', value: 1000000 },
  { label: '+2Tr', value: 2000000 },
  { label: '+5Tr', value: 5000000 },
  { label: '+10Tr', value: 10000000 },
  { label: '+50Tr', value: 50000000 },
];

/**
 * Intelligent SMS / App Notification Parser for Vietnamese Banking
 * Supports: Vietcombank, Techcombank, MBBank, VPBank, ACB, BIDV, TPBank, MoMo, ZaloPay, etc.
 */
export interface ParsedSmsResult {
  amount: number;
  type: 'Withdrawal' | 'Deposit' | 'Transfer';
  date?: string;
  counterparty?: string;
  description: string;
  bankCode?: string;
  accountSuffix?: string;
  rawText: string;
  confidence: number;
}

export function parseVietnameseBankNotification(text: string): ParsedSmsResult | null {
  if (!text || text.trim().length < 10) return null;
  const raw = text.trim();
  const lower = raw.toLowerCase();

  let amount = 0;
  let type: 'Withdrawal' | 'Deposit' | 'Transfer' = 'Withdrawal';
  let bankCode = '';
  let accountSuffix = '';
  let description = '';
  let counterparty = '';
  let confidence = 0.5;

  // 1. Detect Bank
  for (const b of VIETNAM_BANKS) {
    if (lower.includes(b.code.toLowerCase()) || lower.includes(b.shortName.toLowerCase())) {
      bankCode = b.code;
      break;
    }
  }

  // 2. Detect Transaction Type (+ / - / GD / SD)
  const hasPlus = /[+]|tang|nhan duoc|cong/i.test(raw);
  const hasMinus = /[-]|giam|tru|thanh toan|chuyen di|rut tien/i.test(raw);

  if (hasPlus && !hasMinus) {
    type = 'Deposit';
    confidence += 0.2;
  } else if (hasMinus) {
    type = 'Withdrawal';
    confidence += 0.2;
  } else if (lower.includes('nhan tu') || lower.includes('chuyen den')) {
    type = 'Deposit';
  } else {
    type = 'Withdrawal';
  }

  // 3. Extract Amount (VND amounts like 50,000VND, 1.500.000d, 5000000, +2,000,000 VND)
  // Match signs (+/-) followed by numbers with comma/dot separators and optional VND/d
  const amountRegex = /(?:[+\-]?\s*)(\d{1,3}(?:[.,]\d{3})*|\d+)\s*(?:vnd|vnđ|d|đ|\$)?(?:\s|$|[.,])/gi;
  const matches = [...raw.matchAll(amountRegex)];
  
  for (const m of matches) {
    const rawNum = m[1].replace(/[.,]/g, '');
    const val = parseInt(rawNum, 10);
    // Discard account numbers or OTPs that might match if they are too big or too small (e.g. 4-6 digits without separators might be OTP)
    if (val >= 1000 && val <= 50000000000) {
      amount = val;
      confidence += 0.2;
      break;
    }
  }

  // 4. Extract Account Suffix (e.g. TK 0123... or TK ****1234)
  const accMatch = raw.match(/(?:tk|tai khoan|the|so the)\s*[:.]?\s*(\S+)/i);
  if (accMatch) {
    accountSuffix = accMatch[1].slice(-4);
  }

  // 5. Extract Reference / Note / Description
  const noteMatch = raw.match(/(?:ref|nd|noi dung|ly do|tai|gd:)\s*[:.]?\s*([^.\n]+)/i);
  if (noteMatch) {
    description = noteMatch[1].trim();
  } else {
    // Generate intelligent default description
    description = type === 'Deposit' ? 'Nhận tiền chuyển khoản' : 'Thanh toán chi tiêu';
    if (bankCode) description += ` qua ${bankCode}`;
  }

  // 6. Extract Counterparty (Highlands, Shopee, Grab, Nguyen Van A...)
  const merchantMatch = raw.match(/(?:tai|merchant|nguoi gui|tu)\s*[:.]?\s*([^,.\n]+)/i);
  if (merchantMatch) {
    counterparty = merchantMatch[1].trim();
  }

  if (amount > 0) {
    return {
      amount,
      type,
      description: description || (type === 'Deposit' ? 'Thu nhập' : 'Chi tiêu'),
      counterparty,
      bankCode,
      accountSuffix,
      rawText: raw,
      confidence: Math.min(1.0, confidence)
    };
  }

  return null;
}
