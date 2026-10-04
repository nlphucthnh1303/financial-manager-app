/**
 * Vietnamese Banking & E-Wallets Ecosystem - Comprehensive & Modern Version
 * Metadata for 35+ Vietnamese Banks & E-wallets, VietQR Generator, SMS Parser, and Vietnamese Number-to-Words
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
  logoUrl: string;
  type: 'bank' | 'wallet' | 'digital';
  popular?: boolean;
}

export const VIETNAM_BANKS: VietnamBank[] = [
  // --- BIG 4 QUỐC DOANH ---
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
    logoUrl: 'https://api.vietqr.io/img/VCB.png',
    type: 'bank',
    popular: true,
  },
  {
    id: 'ctg',
    code: 'CTG',
    name: 'Ngân hàng Công thương Việt Nam (VietinBank)',
    shortName: 'VietinBank',
    bin: '970415',
    color: '#005193',
    textColor: '#ffffff',
    bgGradient: 'from-blue-700 to-blue-950',
    logo: '🏛️',
    logoUrl: 'https://api.vietqr.io/img/ICB.png',
    type: 'bank',
    popular: true,
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
    logoUrl: 'https://api.vietqr.io/img/BIDV.png',
    type: 'bank',
    popular: true,
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
    logoUrl: 'https://api.vietqr.io/img/VBA.png',
    type: 'bank',
    popular: true,
  },

  // --- NGÂN HÀNG THƯƠNG MẠI CỔ PHẦN HÀNG ĐẦU ---
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
    logoUrl: 'https://api.vietqr.io/img/TCB.png',
    type: 'bank',
    popular: true,
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
    logoUrl: 'https://api.vietqr.io/img/MB.png',
    type: 'bank',
    popular: true,
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
    logoUrl: 'https://api.vietqr.io/img/ACB.png',
    type: 'bank',
    popular: true,
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
    logoUrl: 'https://api.vietqr.io/img/VPB.png',
    type: 'bank',
    popular: true,
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
    logoUrl: 'https://api.vietqr.io/img/TPB.png',
    type: 'bank',
    popular: true,
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
    logoUrl: 'https://api.vietqr.io/img/STB.png',
    type: 'bank',
    popular: true,
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
    logoUrl: 'https://api.vietqr.io/img/HDB.png',
    type: 'bank',
    popular: true,
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
    logoUrl: 'https://api.vietqr.io/img/VIB.png',
    type: 'bank',
    popular: true,
  },
  {
    id: 'lpb',
    code: 'LPB',
    name: 'Ngân hàng Bưu điện Liên Việt (LPBank)',
    shortName: 'LPBank',
    bin: '970449',
    color: '#f58220',
    textColor: '#ffffff',
    bgGradient: 'from-amber-600 to-orange-950',
    logo: '📯',
    logoUrl: 'https://api.vietqr.io/img/LPB.png',
    type: 'bank',
    popular: true,
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
    logoUrl: 'https://api.vietqr.io/img/MSB.png',
    type: 'bank',
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
    logoUrl: 'https://api.vietqr.io/img/OCB.png',
    type: 'bank',
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
    logoUrl: 'https://api.vietqr.io/img/SHB.png',
    type: 'bank',
  },
  {
    id: 'seab',
    code: 'SEAB',
    name: 'Ngân hàng Đông Nam Á (SeABank)',
    shortName: 'SeABank',
    bin: '970440',
    color: '#c9141d',
    textColor: '#ffffff',
    bgGradient: 'from-rose-700 to-red-950',
    logo: '⛵',
    logoUrl: 'https://api.vietqr.io/img/SEAB.png',
    type: 'bank',
  },
  {
    id: 'eib',
    code: 'EIB',
    name: 'Ngân hàng Xuất Nhập Khẩu Việt Nam (Eximbank)',
    shortName: 'Eximbank',
    bin: '970431',
    color: '#0072bc',
    textColor: '#ffffff',
    bgGradient: 'from-blue-600 to-sky-950',
    logo: '🌐',
    logoUrl: 'https://api.vietqr.io/img/EIB.png',
    type: 'bank',
  },
  {
    id: 'nab',
    code: 'NAB',
    name: 'Ngân hàng Nam Á (Nam A Bank)',
    shortName: 'Nam A Bank',
    bin: '970428',
    color: '#fdb913',
    textColor: '#000000',
    bgGradient: 'from-amber-500 to-yellow-800',
    logo: '⭐',
    logoUrl: 'https://api.vietqr.io/img/NAB.png',
    type: 'bank',
  },
  {
    id: 'pvcb',
    code: 'PVCB',
    name: 'Ngân hàng Đại Chúng Việt Nam (PVcomBank)',
    shortName: 'PVcomBank',
    bin: '970412',
    color: '#f8931f',
    textColor: '#ffffff',
    bgGradient: 'from-orange-500 to-amber-900',
    logo: '🔥',
    logoUrl: 'https://api.vietqr.io/img/PVCB.png',
    type: 'bank',
  },
  {
    id: 'bab',
    code: 'BAB',
    name: 'Ngân hàng Bắc Á (Bac A Bank)',
    shortName: 'Bac A Bank',
    bin: '970409',
    color: '#7b1424',
    textColor: '#ffffff',
    bgGradient: 'from-red-900 to-stone-950',
    logo: '🌟',
    logoUrl: 'https://api.vietqr.io/img/BAB.png',
    type: 'bank',
  },
  {
    id: 'klb',
    code: 'KLB',
    name: 'Ngân hàng Kiên Long (Kienlongbank)',
    shortName: 'Kienlongbank',
    bin: '970452',
    color: '#006c3b',
    textColor: '#ffffff',
    bgGradient: 'from-green-700 to-emerald-950',
    logo: '🐉',
    logoUrl: 'https://api.vietqr.io/img/KLB.png',
    type: 'bank',
  },

  // --- NGÂN HÀNG SỐ (DIGITAL BANKS) ---
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
    logoUrl: 'https://api.vietqr.io/img/CAKE.png',
    type: 'digital',
    popular: true,
  },
  {
    id: 'timo',
    code: 'TIMO',
    name: 'Ngân hàng số Timo by BVBank',
    shortName: 'Timo Digital',
    bin: '963388',
    color: '#8b5cf6',
    textColor: '#ffffff',
    bgGradient: 'from-purple-600 to-violet-950',
    logo: '💜',
    logoUrl: 'https://api.vietqr.io/img/TIMO.png',
    type: 'digital',
    popular: true,
  },
  {
    id: 'tnex',
    code: 'TNEX',
    name: 'Ngân hàng số TNEX by MSB',
    shortName: 'TNEX',
    bin: '970426',
    color: '#00b4d8',
    textColor: '#ffffff',
    bgGradient: 'from-cyan-600 to-blue-950',
    logo: '🚀',
    logoUrl: 'https://api.vietqr.io/img/MSB.png',
    type: 'digital',
  },
  {
    id: 'liobank',
    code: 'LIO',
    name: 'Ngân hàng số Liobank by OCB',
    shortName: 'Liobank',
    bin: '970448',
    color: '#171717',
    textColor: '#ffffff',
    bgGradient: 'from-zinc-800 to-black',
    logo: '💳',
    logoUrl: 'https://api.vietqr.io/img/OCB.png',
    type: 'digital',
  },

  // --- VÍ ĐIỆN TỬ & FINTECH (E-WALLETS) ---
  {
    id: 'momo',
    code: 'MOMO',
    name: 'Ví điện tử MoMo',
    shortName: 'Ví MoMo',
    bin: '970422',
    color: '#a50064',
    textColor: '#ffffff',
    bgGradient: 'from-pink-700 to-purple-950',
    logo: '👛',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png',
    type: 'wallet',
    popular: true,
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
    logoUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-ZaloPay-Square.png',
    type: 'wallet',
    popular: true,
  },
  {
    id: 'viettelmoney',
    code: 'VIETTELMONEY',
    name: 'Ví Viettel Money',
    shortName: 'Viettel Money',
    bin: '970422',
    color: '#ee0033',
    textColor: '#ffffff',
    bgGradient: 'from-red-600 to-rose-950',
    logo: '📱',
    logoUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-Viettel-Money.png',
    type: 'wallet',
    popular: true,
  },
  {
    id: 'vnpay',
    code: 'VNPAY',
    name: 'Ví điện tử VNPAY',
    shortName: 'Ví VNPAY',
    bin: '970422',
    color: '#005baa',
    textColor: '#ffffff',
    bgGradient: 'from-sky-600 to-blue-950',
    logo: '💎',
    logoUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR.png',
    type: 'wallet',
    popular: true,
  },
  {
    id: 'shopeepay',
    code: 'SHOPEEPAY',
    name: 'Ví điện tử ShopeePay',
    shortName: 'ShopeePay',
    bin: '970422',
    color: '#ee4d2d',
    textColor: '#ffffff',
    bgGradient: 'from-orange-600 to-rose-950',
    logo: '🛍️',
    logoUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-ShopeePay-V.png',
    type: 'wallet',
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
    logoUrl: '',
    type: 'wallet',
    popular: true,
  }
];

export function findBankByKeyword(keyword: string): VietnamBank | undefined {
  if (!keyword) return undefined;
  const kw = keyword.toLowerCase().trim();
  return VIETNAM_BANKS.find(b => 
    b.code.toLowerCase() === kw || 
    b.shortName.toLowerCase().includes(kw) || 
    b.name.toLowerCase().includes(kw) ||
    (b.bin && b.bin.includes(kw))
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
  if (num < 0) return `Âm ${numberToVietnameseWords(Math.abs(num)).toLowerCase()}`;

  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

  const readGroup3 = (g: number, showZeroHundred: boolean): string => {
    const h = Math.floor(g / 100);
    const t = Math.floor((g % 100) / 10);
    const u = g % 10;
    let res = '';

    if (h > 0 || showZeroHundred) {
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
    } else if (t === 0 && u > 0) {
      if (h > 0 || showZeroHundred) res += 'lẻ ';
      res += `${digits[u]} `;
    }

    return res.trim();
  };

  const groups: number[] = [];
  let temp = num;
  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  let resultWords = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g > 0) {
      const gStr = readGroup3(g, i < groups.length - 1);
      resultWords += `${gStr} ${units[i]} `;
    }
  }

  resultWords = resultWords.trim() + ' đồng';
  return resultWords.charAt(0).toUpperCase() + resultWords.slice(1);
}

export interface ParsedSmsResult {
  bankCode: string;
  bankName: string;
  amount: number;
  type: 'Withdrawal' | 'Deposit';
  balance?: number;
  accountNumber?: string;
  memo?: string;
  description?: string;
  confidence: number;
  date?: string;
  rawSms: string;
}

/**
 * Intelligent Vietnamese Bank SMS Transaction Parser
 */
export function parseVietnameseBankSms(sms: string): ParsedSmsResult | null {
  if (!sms || sms.trim().length < 10) return null;
  const raw = sms.trim();
  const lower = raw.toLowerCase();

  // Detect bank
  let matchedBank = VIETNAM_BANKS.find(b => 
    lower.includes(b.code.toLowerCase()) || 
    lower.includes(b.shortName.toLowerCase()) ||
    (b.code === 'VCB' && lower.includes('vcb')) ||
    (b.code === 'CTG' && (lower.includes('vietin') || lower.includes('icb'))) ||
    (b.code === 'TCB' && lower.includes('tcb')) ||
    (b.code === 'MB' && lower.includes('mbbank')) ||
    (b.code === 'VPB' && lower.includes('vpbank'))
  );

  if (!matchedBank) {
    matchedBank = VIETNAM_BANKS[0]; // fallback
  }

  // Detect Amount & Type
  let type: 'Withdrawal' | 'Deposit' = 'Withdrawal';
  let amount = 0;

  // Patterns like +500,000VND or -200.000d or GD: +1,000,000 VND
  const plusMatch = raw.match(/\+\s*([\d,.]+)\s*(?:vnd|vnđ|đ)/i) || raw.match(/tang\s*([\d,.]+)/i);
  const minusMatch = raw.match(/-\s*([\d,.]+)\s*(?:vnd|vnđ|đ)/i) || raw.match(/giam\s*([\d,.]+)/i);
  const genericAmountMatch = raw.match(/(?:so tien|sotien|gd|sodu thay doi|bien dong)\s*:?\s*([+-]?[\d,.]+)\s*(?:vnd|vnđ|đ)?/i);

  if (plusMatch) {
    type = 'Deposit';
    amount = parseNumberString(plusMatch[1]);
  } else if (minusMatch) {
    type = 'Withdrawal';
    amount = parseNumberString(minusMatch[1]);
  } else if (genericAmountMatch) {
    const valStr = genericAmountMatch[1];
    if (valStr.startsWith('+')) type = 'Deposit';
    else if (valStr.startsWith('-')) type = 'Withdrawal';
    else if (lower.includes('nhan tien') || lower.includes('chuyen den') || lower.includes('cong tien')) type = 'Deposit';
    amount = parseNumberString(valStr);
  }

  // Account Number
  const accMatch = raw.match(/(?:tk|tai khoan|the|so tk|stk)\s*[:#]?\s*([0-9xX*]+)/i);
  const accountNumber = accMatch ? accMatch[1] : undefined;

  // Balance
  const balMatch = raw.match(/(?:sd|so du|sodu|du cuoi)\s*[:#]?\s*([\d,.]+)\s*(?:vnd|vnđ|đ)/i);
  const balance = balMatch ? parseNumberString(balMatch[1]) : undefined;

  // Memo/Content
  const memoMatch = raw.match(/(?:nd|noi dung|ly do|ndgd|ref)\s*[:#]?\s*([^.]+)/i);
  const memo = memoMatch ? memoMatch[1].trim() : undefined;
  const desc = memo || `${type === 'Deposit' ? 'Nhận tiền' : 'Chi tiêu'} qua ${matchedBank.shortName}`;

  if (amount <= 0) return null;

  return {
    bankCode: matchedBank.code,
    bankName: matchedBank.shortName,
    amount,
    type,
    balance,
    accountNumber,
    memo,
    description: desc,
    confidence: 0.95,
    date: new Date().toISOString(),
    rawSms: raw,
  };
}

export const parseVietnameseBankNotification = parseVietnameseBankSms;

function parseNumberString(str: string): number {
  if (!str) return 0;
  // Remove +, -, spaces
  const clean = str.replace(/[+\-\s]/g, '');
  // If format is 1.000.000 or 1,000,000
  const normalized = clean.replace(/[,.]/g, '');
  const n = parseInt(normalized, 10);
  return isNaN(n) ? 0 : n;
}
