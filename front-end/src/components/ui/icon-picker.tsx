import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search, Check, Sparkles, Palette, Smile, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface IconDefinition {
  name: string;
  label: string;
  category: string;
  keywords: string[];
}

export const CURATED_ICONS: IconDefinition[] = [
  // 💰 TÀI CHÍNH & TIỀN TỆ
  { name: 'Wallet', label: 'Ví tiền', category: 'Tài chính', keywords: ['vi', 'tien', 'wallet', 'money', 'cash'] },
  { name: 'CreditCard', label: 'Thẻ tín dụng/ATM', category: 'Tài chính', keywords: ['the', 'atm', 'credit', 'card', 'bank'] },
  { name: 'Landmark', label: 'Ngân hàng', category: 'Tài chính', keywords: ['ngan hang', 'bank', 'tru so', 'tai chinh'] },
  { name: 'DollarSign', label: 'Tiền tệ', category: 'Tài chính', keywords: ['dollar', 'vnd', 'tien', 'thu nhap', 'do la'] },
  { name: 'Coins', label: 'Tiền xu / Vàng', category: 'Tài chính', keywords: ['xu', 'vang', 'coins', 'tiet kiem'] },
  { name: 'PiggyBank', label: 'Heo đất tiết kiệm', category: 'Tài chính', keywords: ['heo', 'tiet kiem', 'piggy', 'savings'] },
  { name: 'Receipt', label: 'Hóa đơn & Biên lai', category: 'Tài chính', keywords: ['hoa don', 'receipt', 'bill', 'chung tu'] },
  { name: 'TrendingUp', label: 'Đầu tư sinh lời', category: 'Tài chính', keywords: ['dau tu', 'co phieu', 'lai', 'growth'] },
  { name: 'TrendingDown', label: 'Chi phí phát sinh', category: 'Tài chính', keywords: ['giam', 'lo', 'chi phi'] },
  { name: 'Banknote', label: 'Tiền mặt giấy', category: 'Tài chính', keywords: ['tien mat', 'cash', 'giay'] },
  { name: 'HandCoins', label: 'Vay nợ & Cho vay', category: 'Tài chính', keywords: ['vay', 'muon', 'tra no', 'debt'] },
  { name: 'Scale', label: 'Cân bằng tài chính', category: 'Tài chính', keywords: ['can bang', 'can doi', 'balance'] },
  { name: 'BadgePercent', label: 'Lãi suất / Chiết khấu', category: 'Tài chính', keywords: ['phan tram', 'chiet khau', 'giam gia', 'lai suat'] },
  { name: 'QrCode', label: 'Mã QR thanh toán', category: 'Tài chính', keywords: ['qr', 'quet ma', 'vietqr', 'napas'] },

  // 🍜 ĂN UỐNG & CAFE
  { name: 'Utensils', label: 'Ăn uống / Nhà hàng', category: 'Ăn uống', keywords: ['an', 'uong', 'nha hang', 'com', 'food'] },
  { name: 'Coffee', label: 'Cà phê & Trà sữa', category: 'Ăn uống', keywords: ['cafe', 'ca phe', 'tra sua', 'drink'] },
  { name: 'Pizza', label: 'Đồ ăn nhanh / Fastfood', category: 'Ăn uống', keywords: ['pizza', 'fastfood', 'snack'] },
  { name: 'Apple', label: 'Trái cây & Nông sản', category: 'Ăn uống', keywords: ['trai cay', 'hoa qua', 'rau cu', 'fruit'] },
  { name: 'Wine', label: 'Tiệc tùng & Rượu bia', category: 'Ăn uống', keywords: ['ruou', 'bia', 'nhau', 'party'] },
  { name: 'Beer', label: 'Bia & Hội họp', category: 'Ăn uống', keywords: ['bia', 'beer', 'quan nhau'] },

  // 🛒 MUA SẮM & SINH HOẠT
  { name: 'ShoppingCart', label: 'Siêu thị & Chợ', category: 'Mua sắm', keywords: ['sieu thi', 'cho', 'cart', 'tap hoa'] },
  { name: 'ShoppingBag', label: 'Mua sắm Shopping', category: 'Mua sắm', keywords: ['shopping', 'mua sam', 'bag', 'store'] },
  { name: 'Store', label: 'Cửa hàng tiện lợi', category: 'Mua sắm', keywords: ['cua hang', 'shop', 'circle k', 'vinmart'] },
  { name: 'Gift', label: 'Quà tặng & Hiếu hỷ', category: 'Mua sắm', keywords: ['qua', 'bieu', 'tang', 'mung', 'cuoi'] },
  { name: 'Shirt', label: 'Quần áo & Thời trang', category: 'Mua sắm', keywords: ['quan ao', 'thoi trang', 'fashion', 'clothes'] },
  { name: 'Sparkles', label: 'Làm đẹp & Mỹ phẩm', category: 'Mua sắm', keywords: ['my pham', 'lam dep', 'spa', 'skincare'] },
  { name: 'Tag', label: 'Khuyến mãi & Săn sale', category: 'Mua sắm', keywords: ['tag', 'giam gia', 'sale', 'voucher'] },
  { name: 'Package', label: 'Ship hàng & Chuyển phát', category: 'Mua sắm', keywords: ['ship', 'giao hang', 'shopee', 'lazada'] },
  { name: 'Gem', label: 'Trang sức & Xa xỉ', category: 'Mua sắm', keywords: ['nhan', 'day chuyen', 'vang bac', 'kim cuong'] },
  { name: 'Watch', label: 'Đồng hồ & Phụ kiện', category: 'Mua sắm', keywords: ['dong ho', 'watch', 'phu kien'] },

  // 🏠 NHÀ CỬA & HÓA ĐƠN
  { name: 'Home', label: 'Thuê nhà / Tiền nhà', category: 'Nhà cửa', keywords: ['nha', 'tien nha', 'phong', 'house', 'home'] },
  { name: 'Building', label: 'Chung cư / Bất động sản', category: 'Nhà cửa', keywords: ['chung cu', 'can ho', 'toa nha'] },
  { name: 'Zap', label: 'Hóa đơn tiền điện', category: 'Nhà cửa', keywords: ['dien', 'tien dien', 'evn', 'electric'] },
  { name: 'Droplet', label: 'Hóa đơn tiền nước', category: 'Nhà cửa', keywords: ['nuoc', 'tien nuoc', 'water'] },
  { name: 'Flame', label: 'Khí gas / Nấu nướng', category: 'Nhà cửa', keywords: ['gas', 'bep', 'nau'] },
  { name: 'Wifi', label: 'Internet / Cáp quang', category: 'Nhà cửa', keywords: ['wifi', 'mang', 'internet', 'fpt', 'viettel', 'vnpt'] },
  { name: 'Tv', label: 'Truyền hình / Netflix', category: 'Nhà cửa', keywords: ['tv', 'netflix', 'truyen hinh', 'k+'] },
  { name: 'Smartphone', label: 'Cước điện thoại / 4G', category: 'Nhà cửa', keywords: ['dien thoai', '4g', 'nap the', 'phone'] },
  { name: 'Key', label: 'Sửa chữa & Khóa nhà', category: 'Nhà cửa', keywords: ['khoa', 'chia khoa', 'key'] },
  { name: 'Wrench', label: 'Bảo trì & Dịch vụ', category: 'Nhà cửa', keywords: ['bao tri', 'sua chua', 'tho'] },

  // 🚗 ĐI LẠI & PHƯƠNG TIỆN
  { name: 'Car', label: 'Ô tô / Taxi / Grab', category: 'Đi lại', keywords: ['o to', 'taxi', 'grab', 'be', 'car'] },
  { name: 'Fuel', label: 'Xăng xe / Nhiên liệu', category: 'Đi lại', keywords: ['xang', 'dau', 'petrolimex', 'fuel', 'gas'] },
  { name: 'Bike', label: 'Xe máy / Xe đạp', category: 'Đi lại', keywords: ['xe may', 'xe dap', 'honda', 'yamaha'] },
  { name: 'Bus', label: 'Xe buýt / Xe khách', category: 'Đi lại', keywords: ['xe buyt', 'bus', 'xe khach', 'phuong trang'] },
  { name: 'Train', label: 'Tàu hỏa / Tàu điện Metro', category: 'Đi lại', keywords: ['tau hoa', 'metro', 'duong sat'] },
  { name: 'Plane', label: 'Vé máy bay / Du lịch', category: 'Đi lại', keywords: ['may bay', 've', 'flight', 'travel'] },
  { name: 'Navigation', label: 'Phí cầu đường BOT / Đỗ xe', category: 'Đi lại', keywords: ['bot', 'gui xe', 'do xe', 'cau duong'] },

  // 💊 SỨC KHỎE & BẢO HIỂM
  { name: 'Heart', label: 'Sức khỏe & Khám bệnh', category: 'Sức khỏe', keywords: ['suc khoe', 'kham', 'benh', 'y te'] },
  { name: 'HeartPulse', label: 'Bảo hiểm nhân thọ/Y tế', category: 'Sức khỏe', keywords: ['bao hiem', 'bhxh', 'bhyt', 'manulife', 'prudential'] },
  { name: 'Pill', label: 'Thuốc men & Dược phẩm', category: 'Sức khỏe', keywords: ['thuoc', 'hieu thuoc', 'long chau', 'pharmacity'] },
  { name: 'Activity', label: 'Tập thể dục / Gym', category: 'Sức khỏe', keywords: ['gym', 'yoga', 'the duc', 'fitness'] },
  { name: 'Baby', label: 'Bỉm sữa & Trẻ em', category: 'Sức khỏe', keywords: ['em be', 'bim', 'sua', 'con cai', 'baby'] },
  { name: 'ShieldCheck', label: 'Bảo vệ & An toàn', category: 'Sức khỏe', keywords: ['bao ve', 'an toan', 'shield'] },

  // 📚 HỌC TẬP & CÔNG VIỆC
  { name: 'BookOpen', label: 'Sách vở & Học phí', category: 'Học tập', keywords: ['sach', 'hoc phi', 'khoa hoc', 'truong'] },
  { name: 'GraduationCap', label: 'Đại học & Bằng cấp', category: 'Học tập', keywords: ['dai hoc', 'bang', 'hoc bong'] },
  { name: 'Briefcase', label: 'Lương & Công việc', category: 'Công việc', keywords: ['luong', 'cong viec', 'job', 'salary', 'thu nhap'] },
  { name: 'Laptop', label: 'Thiết bị IT & Phần mềm', category: 'Công việc', keywords: ['laptop', 'may tinh', 'phan mem', 'software'] },
  { name: 'Award', label: 'Thưởng & Khen ngợi', category: 'Công việc', keywords: ['thuong', 'bonus', 'kpi'] },
  { name: 'Target', label: 'Mục tiêu tài chính', category: 'Công việc', keywords: ['muc tieu', 'target', 'ke hoach'] },

  // 🎮 GIẢI TRÍ & DU LỊCH
  { name: 'Film', label: 'Xem phim / Rạp chiếu', category: 'Giải trí', keywords: ['phim', 'cgv', 'lotte', 'movie', 'cinema'] },
  { name: 'Gamepad2', label: 'Game & Nạp thẻ', category: 'Giải trí', keywords: ['game', 'steam', 'play', 'tro choi'] },
  { name: 'Music', label: 'Âm nhạc / Spotify', category: 'Giải trí', keywords: ['nhac', 'spotify', 'apple music', 'ca nhac'] },
  { name: 'Camera', label: 'Nhiếp ảnh & Sở thích', category: 'Giải trí', keywords: ['anh', 'chup hinh', 'camera'] },
  { name: 'Ticket', label: 'Vé sự kiện & Concert', category: 'Giải trí', keywords: ['ve', 'concert', 'su kien', 'show'] },
  { name: 'Palette', label: 'Nghệ thuật & Sáng tạo', category: 'Giải trí', keywords: ['ve', 'nghe thuat', 'art'] },
];

export const POPULAR_EMOJIS = [
  '🍜', '☕', '🛒', '🏠', '💡', '🚗', '⛽', '🎬', '🎁', '💊', '📚', '👕', 
  '✈️', '💰', '💼', '📈', '🐷', '📁', '💻', '🏋️', '👶', '❤️', '💎', '🍕', 
  '🍔', '🍣', '🍰', '🍺', '🎉', '🏖️', '💵', '💳', '⭐', '🔥', '🌱', '🌟'
];

export const CURATED_COLORS = [
  '#171717', '#444444', '#71717a', '#0070f3', '#06b6d4', 
  '#10b981', '#16a34a', '#eab308', '#f97316', '#ff5b4f', 
  '#ec4899', '#8b5cf6', '#6366f1', '#059669', '#d97706'
];

/**
 * Component render icon an toàn: Nhận diện cả Lucide icon name, Emoji hoặc Text
 */
export const IconRenderer: React.FC<{
  name?: string;
  className?: string;
  color?: string;
  size?: number;
}> = ({ name, className = 'w-4 h-4', color, size = 16 }) => {
  if (!name) {
    return <LucideIcons.Folder className={className} style={{ color }} />;
  }

  // Check if emoji
  if (/\p{Extended_Pictographic}/u.test(name) || name.length <= 4 && !/^[A-Za-z0-9]+$/.test(name)) {
    return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>{name}</span>;
  }

  // Lookup in LucideIcons
  const IconComp = (LucideIcons as any)[name] || (LucideIcons as any)[name.replace(/\s+/g, '')];
  if (IconComp) {
    return <IconComp className={className} style={{ color }} />;
  }

  return <LucideIcons.Folder className={className} style={{ color }} />;
};

interface IconPickerProps {
  value: string;
  color?: string;
  onChange: (iconName: string, color?: string) => void;
  showColorPicker?: boolean;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  value,
  color = '#171717',
  onChange,
  showColorPicker = true,
}) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'icons' | 'emojis'>('icons');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [selectedIcon, setSelectedIcon] = useState(value || 'Utensils');
  const [selectedColor, setSelectedColor] = useState(color);

  const categories = useMemo(() => {
    const set = new Set<string>();
    CURATED_ICONS.forEach((i) => set.add(i.category));
    return ['Tất cả', ...Array.from(set)];
  }, []);

  const filteredIcons = useMemo(() => {
    let list = CURATED_ICONS;
    if (selectedCategory !== 'Tất cả') {
      list = list.filter((i) => i.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.label.toLowerCase().includes(q) ||
          i.keywords.some((k) => k.includes(q))
      );
    }
    return list;
  }, [search, selectedCategory]);

  const handleSelectIcon = (iconName: string) => {
    setSelectedIcon(iconName);
  };

  const handleSelectColor = (col: string) => {
    setSelectedColor(col);
  };

  const handleConfirm = () => {
    onChange(selectedIcon, selectedColor);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setSelectedIcon(value || 'Utensils');
            setSelectedColor(color || '#171717');
            setOpen(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md shadow-border bg-[#ffffff] dark:bg-[#111111] hover:bg-[#fafafa] dark:hover:bg-[#1a1a1a] transition-colors"
        >
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center shadow-sm"
            style={{ backgroundColor: `${color}20`, color: color }}
          >
            <IconRenderer name={value} color={color} size={16} className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-[#171717] dark:text-[#ededed]">
            {value || 'Chọn biểu tượng'}
          </span>
        </button>

        {showColorPicker && (
          <div className="flex items-center gap-1.5">
            {CURATED_COLORS.slice(0, 5).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setSelectedColor(c);
                  onChange(value, c);
                }}
                className={`w-5 h-5 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-[#0070f3] scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Selection */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222222] shadow-2xl rounded-2xl p-5 sm:p-6">
          <DialogHeader className="space-y-1.5 pb-1">
            <DialogTitle className="text-base sm:text-lg font-semibold text-[#171717] dark:text-[#ededed] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0070f3]/10 text-[#0070f3] flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>Chọn biểu tượng & Màu sắc</span>
              </span>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-inner border border-[#e5e5e5] dark:border-[#262626]"
                style={{ backgroundColor: `${selectedColor}20`, color: selectedColor }}
              >
                <IconRenderer name={selectedIcon} color={selectedColor} size={20} className="w-5 h-5" />
              </div>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-[#666666] dark:text-[#a1a1a1]">
              Hơn 100+ biểu tượng vector hiện đại theo chuẩn ReUI / Lucide
            </DialogDescription>
          </DialogHeader>

          {/* Tabs: Vector Icons vs Emojis */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]">
            <button
              type="button"
              onClick={() => setActiveTab('icons')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'icons'
                  ? 'bg-[#ffffff] dark:bg-[#222222] text-[#171717] dark:text-[#ededed] shadow-xs'
                  : 'text-[#666666] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ededed]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Vector Icons (ReUI)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('emojis')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'emojis'
                  ? 'bg-[#ffffff] dark:bg-[#222222] text-[#171717] dark:text-[#ededed] shadow-xs'
                  : 'text-[#666666] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ededed]'
              }`}
            >
              <Smile className="w-3.5 h-3.5" /> Bộ Emoji
            </button>
          </div>

          {/* Color Palette Selector */}
          {showColorPicker && (
            <div className="py-1">
              <span className="text-xs font-medium text-[#666666] dark:text-[#a1a1a1] block mb-1.5">
                Bảng màu nhận diện:
              </span>
              <div className="flex flex-wrap gap-2 items-center">
                {CURATED_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSelectColor(c)}
                    className={`w-6 h-6 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                      selectedColor === c ? 'ring-2 ring-offset-2 ring-[#0070f3] scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {selectedColor === c && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'icons' ? (
            <div className="flex-1 overflow-hidden flex flex-col space-y-2.5">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
                <Input
                  placeholder="Tìm icon (VD: vi, xang, ca phe, the, tien, nha)…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg whitespace-nowrap transition-all cursor-pointer font-medium ${
                      selectedCategory === cat
                        ? 'bg-[#171717] dark:bg-[#ededed] text-white dark:text-black shadow-xs'
                        : 'bg-[#fafafa] dark:bg-[#111111] text-[#666666] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ededed] border border-[#e5e5e5] dark:border-[#262626]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Icon Grid */}
              <div className="flex-1 overflow-y-auto max-h-56 pr-1 grid grid-cols-5 sm:grid-cols-6 gap-2">
                {filteredIcons.map((item) => {
                  const isSelected = selectedIcon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleSelectIcon(item.name)}
                      title={item.label}
                      className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0070f3] text-white shadow-sm ring-2 ring-[#0070f3] ring-offset-1'
                          : 'bg-[#fafafa] dark:bg-[#111111] hover:bg-[#f0f0f0] dark:hover:bg-[#161616] text-[#171717] dark:text-[#ededed] border border-[#e5e5e5] dark:border-[#262626]'
                      }`}
                    >
                      <IconRenderer
                        name={item.name}
                        color={isSelected ? '#ffffff' : selectedColor}
                        size={20}
                        className="w-5 h-5"
                      />
                      <span className="text-[10px] truncate max-w-full font-medium">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-64 grid grid-cols-6 gap-2 p-1">
              {POPULAR_EMOJIS.map((emoji) => {
                const isSelected = selectedIcon === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelectIcon(emoji)}
                    className={`h-12 rounded-xl text-2xl flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0070f3]/20 border-2 border-[#0070f3] scale-105'
                        : 'bg-[#fafafa] dark:bg-[#111111] hover:scale-105 border border-[#e5e5e5] dark:border-[#262626]'
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          )}

          <DialogFooter className="pt-4 mt-2 border-t border-[#f0f0f0] dark:border-[#1f1f1f] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-10 px-4 sm:px-5 text-xs sm:text-sm font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-transparent hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] text-[#666666] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ededed] shadow-xs cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              className="h-10 px-5 sm:px-6 text-xs sm:text-sm font-medium rounded-lg bg-[#171717] dark:bg-[#ededed] text-white dark:text-black hover:bg-[#333333] dark:hover:bg-white shadow-sm cursor-pointer"
            >
              Áp dụng biểu tượng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
