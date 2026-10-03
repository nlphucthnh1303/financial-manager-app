/**
 * Vietnamese Banking Receipt / Bill OCR Parser
 * Tự động phân tích chuỗi văn bản OCR từ biên lai chuyển khoản ngân hàng Việt Nam:
 * - Vietcombank, MB Bank, Techcombank, VPBank, ACB, BIDV, Agribank, TPBank, MoMo, ZaloPay
 * - Trích xuất: Số tiền, Nội dung/Lời nhắn, Thời gian giao dịch, Ngân hàng, Người nhận/Người gửi
 */

export interface ParsedBankReceipt {
  amount: number;
  transactionType: 'Withdrawal' | 'Deposit' | 'Transfer';
  description: string;
  date: string; // ISO 8601
  bankName: string;
  counterparty: string;
  referenceCode?: string;
  rawText: string;
}

const VIETNAM_BANKS_LIST = [
  { keywords: ['vietcombank', 'vcb', 'digibank'], name: 'Vietcombank' },
  { keywords: ['mb bank', 'mbbank', 'ngan hang quan doi', 'mb '], name: 'MB Bank' },
  { keywords: ['techcombank', 'tcb'], name: 'Techcombank' },
  { keywords: ['vpbank', 'vpb'], name: 'VPBank' },
  { keywords: ['bidv'], name: 'BIDV' },
  { keywords: ['agribank'], name: 'Agribank' },
  { keywords: ['acb', 'a chau'], name: 'ACB' },
  { keywords: ['tpbank', 'tpb', 'tien phong'], name: 'TPBank' },
  { keywords: ['momo'], name: 'Ví MoMo' },
  { keywords: ['zalopay', 'zalo pay'], name: 'ZaloPay' },
  { keywords: ['shb'], name: 'SHB' },
  { keywords: ['vib'], name: 'VIB' },
  { keywords: ['hdbank'], name: 'HDBank' },
  { keywords: ['ocb'], name: 'OCB' },
  { keywords: ['sacombank'], name: 'Sacombank' },
];

export function parseBankReceiptOcr(rawText: string): ParsedBankReceipt {
  const text = rawText || '';
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const lowerText = text.toLowerCase();

  // 1. Detect Bank Name
  let detectedBank = 'Ngân hàng Việt Nam';
  for (const b of VIETNAM_BANKS_LIST) {
    if (b.keywords.some((kw) => lowerText.includes(kw))) {
      detectedBank = b.name;
      break;
    }
  }

  // 2. Detect Transaction Type
  let txType: 'Withdrawal' | 'Deposit' | 'Transfer' = 'Withdrawal';
  if (
    lowerText.includes('nhận tiền') ||
    lowerText.includes('tiền vào') ||
    lowerText.includes('biến động số dư +') ||
    lowerText.includes('nhận được')
  ) {
    txType = 'Deposit';
  } else if (
    lowerText.includes('chuyển khoản nội bộ') ||
    lowerText.includes('chuyển cùng ngân hàng')
  ) {
    txType = 'Transfer';
  }

  // 3. Extract Amount
  // Look for patterns like: "500,000 VND", "500.000 đ", "500.000 VNĐ", "VND 500,000", "Số tiền: 1,250,000"
  let amount = 0;
  const amountRegexes = [
    /(?:số\s*tiền|so\s*tien|amount)[\s:=]*([0-9.,]+)\s*(?:vnd|vnđ|đ)?/i,
    /(?:vnd|vnđ|đ)[\s:=]*([0-9.,]+)/i,
    /([0-9]{1,3}(?:[.,][0-9]{3})+)\s*(?:vnd|vnđ|đ)/i,
    /(?:[-+])\s*([0-9]{1,3}(?:[.,][0-9]{3})+)/,
  ];

  for (const reg of amountRegexes) {
    const match = text.match(reg);
    if (match && match[1]) {
      const cleanNum = match[1].replace(/[,.]/g, '');
      const parsedNum = parseInt(cleanNum, 10);
      if (!isNaN(parsedNum) && parsedNum > 1000) {
        amount = parsedNum;
        break;
      }
    }
  }

  // If still 0, look for any standalone formatted number like 250.000 or 1,500,000
  if (amount === 0) {
    const standaloneMatch = text.match(/\b([1-9][0-9]{0,2}(?:[.,][0-9]{3}){1,3})\b/);
    if (standaloneMatch && standaloneMatch[1]) {
      const parsedNum = parseInt(standaloneMatch[1].replace(/[,.]/g, ''), 10);
      if (!isNaN(parsedNum) && parsedNum >= 1000) {
        amount = parsedNum;
      }
    }
  }

  // 4. Extract Description / Content
  let description = '';
  const descRegexes = [
    /(?:nội\s*dung|noi\s*dung|lời\s*nhắn|loi\s*nhan|ghi\s*chú|ghi\s*chu|lý\s*do|ly\s*do)[\s:=]+([^\n]+)/i,
    /(?:thanh\s*toán\s*cho|chuyển\s*tiền\s*tới|chuyen\s*tien\s*toi)[\s:=]+([^\n]+)/i,
  ];

  for (const reg of descRegexes) {
    const match = text.match(reg);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length > 2 && !candidate.toLowerCase().includes('mã giao dịch')) {
        description = candidate;
        break;
      }
    }
  }

  // 5. Extract Counterparty (Tên người nhận / người gửi)
  let counterparty = '';
  const counterpartyRegexes = [
    /(?:người\s*nhận|nguoi\s*nhan|tên\s*người\s*nhận|tới\s*tài\s*khoản)[\s:=]+([^\n]+)/i,
    /(?:tên\s*tài\s*khoản|chủ\s*tài\s*khoản)[\s:=]+([^\n]+)/i,
    /(?:người\s*chuyển|nguoi\s*chuyen|từ\s*tài\s*khoản)[\s:=]+([^\n]+)/i,
  ];

  for (const reg of counterpartyRegexes) {
    const match = text.match(reg);
    if (match && match[1]) {
      counterparty = match[1].trim();
      break;
    }
  }

  // Default description fallback
  if (!description) {
    if (counterparty) {
      description = `Chuyển tiền ${counterparty} (${detectedBank})`;
    } else {
      description = `Giao dịch ${detectedBank}`;
    }
  }

  // 6. Extract Date & Time
  let date = new Date().toISOString();
  // Match patterns like "03/10/2026 12:30:45", "03-10-2026 12:30", "03/10/2026"
  const dateMatch = text.match(/\b([0-3]?[0-9][\/\-][0-1]?[0-9][\/\-][2][0-9]{3})(?:\s+([0-2]?[0-9]:[0-5][0-9](?::[0-5][0-9])?))?\b/);
  if (dateMatch && dateMatch[1]) {
    const parts = dateMatch[1].split(/[\/\-]/);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    let hour = 12;
    let min = 0;
    if (dateMatch[2]) {
      const timeParts = dateMatch[2].split(':');
      hour = parseInt(timeParts[0], 10);
      min = parseInt(timeParts[1], 10);
    }

    const parsedDate = new Date(year, month, day, hour, min);
    if (!isNaN(parsedDate.getTime())) {
      date = parsedDate.toISOString();
    }
  }

  // 7. Extract Reference Code
  let referenceCode = '';
  const refMatch = text.match(/(?:mã\s*giao\s*dịch|ma\s*giao\s*dich|mã\s*gd|ref\s*no|ft)[\s:=]*([a-z0-9]+)/i);
  if (refMatch && refMatch[1]) {
    referenceCode = refMatch[1].toUpperCase();
  }

  return {
    amount,
    transactionType: txType,
    description,
    date,
    bankName: detectedBank,
    counterparty,
    referenceCode,
    rawText,
  };
}
