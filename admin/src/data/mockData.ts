/**
 * Mock 產品資料 — 對應 product_templates + product_categories + uom_uom
 * 來自紙本單據的真實品項
 */

export interface Category {
  id: string
  name: string
  code: string
}

export interface Product {
  id: string
  name: string
  categoryId: string
  unit: string       // 台斤, 顆, 盒, 包, 把, 件
  defaultCode: string
  supplierId: string
}

export interface Supplier {
  id: string
  ref: string
  name: string
  address: string
  phone: string
  vat: string        // 統一編號
}

export interface Customer {
  id: string
  ref: string
  name: string
  address: string
  phone: string
  vat: string           // 統一編號
  contactPerson: string // 聯絡人
}

export const categories: Category[] = [
  { id: 'cat-1', name: '葉菜類', code: 'A' },
  { id: 'cat-2', name: '根莖類', code: 'B' },
  { id: 'cat-3', name: '瓜果類', code: 'C' },
  { id: 'cat-4', name: '辛香料', code: 'D' },
  { id: 'cat-5', name: '菇豆類', code: 'E' },
  { id: 'cat-6', name: '水果類', code: 'F' },
  { id: 'cat-7', name: '肉品類', code: 'G' },
  { id: 'cat-8', name: '水產類', code: 'H' },
  { id: 'cat-9', name: '其他', code: 'Z' },
]

export const suppliers: Supplier[] = [
  { id: 'sup-1', ref: 'D40', name: '賢辛香料(286)', address: '台北市萬華區環河南路二段286號', phone: '02-2306-XXXX', vat: '12345678' },
  { id: 'sup-2', ref: 'A14', name: 'A紫洋蔥', address: '新北市三重區重新路四段97號', phone: '02-2976-XXXX', vat: '23456789' },
  { id: 'sup-3', ref: 'V01', name: '大盤商A', address: '台北市萬華區萬大路486號', phone: '02-2302-XXXX', vat: '34567890' },
  { id: 'sup-4', ref: 'V02', name: '大盤商B', address: '新北市板橋區民族路168號', phone: '02-2957-XXXX', vat: '45678901' },
  { id: 'sup-5', ref: 'V03', name: '肉品商', address: '新北市新莊區新泰路193號', phone: '02-2201-XXXX', vat: '56789012' },
  { id: 'sup-6', ref: 'V04', name: '水產商', address: '基隆市仁愛區孝一路27號', phone: '02-2428-XXXX', vat: '67890123' },
]

export const customers: Customer[] = [
  { id: 'cust-1', ref: 'G13', name: '快樂瑪麗安 新莊', address: '新莊區中信街172號一樓', phone: '02-2991-XXXX', vat: '80123456', contactPerson: '王小姐' },
  { id: 'cust-2', ref: 'C80', name: '偷閒', address: '中和區景平路123號', phone: '02-2242-XXXX', vat: '80234567', contactPerson: '李經理' },
  { id: 'cust-3', ref: 'F64', name: '番紅', address: '板橋區文化路二段88號', phone: '02-2258-XXXX', vat: '80345678', contactPerson: '張主廚' },
  { id: 'cust-4', ref: 'C41', name: '一鼎', address: '三重區正義北路52號', phone: '02-2981-XXXX', vat: '80456789', contactPerson: '陳先生' },
  { id: 'cust-5', ref: 'H19', name: '金翠', address: '永和區永和路一段10號', phone: '02-2926-XXXX', vat: '80567890', contactPerson: '林老闆' },
  { id: 'cust-6', ref: 'G29', name: '爵新', address: '土城區學府路一段99號', phone: '02-2273-XXXX', vat: '80678901', contactPerson: '黃經理' },
]

export const products: Product[] = [
  // 葉菜類
  { id: 'p-01', name: '初秋高麗A*', categoryId: 'cat-1', unit: '台斤', defaultCode: 'P001', supplierId: 'sup-3' },
  { id: 'p-02', name: '平地初秋A*', categoryId: 'cat-1', unit: '台斤', defaultCode: 'P002', supplierId: 'sup-3' },
  { id: 'p-03', name: '大白菜A', categoryId: 'cat-1', unit: '台斤', defaultCode: 'P003', supplierId: 'sup-3' },
  { id: 'p-04', name: '青江菜A', categoryId: 'cat-1', unit: '台斤', defaultCode: 'P004', supplierId: 'sup-3' },
  { id: 'p-05', name: '菠菜', categoryId: 'cat-1', unit: '台斤', defaultCode: 'P005', supplierId: 'sup-3' },
  { id: 'p-06', name: '油菜A', categoryId: 'cat-1', unit: '台斤', defaultCode: 'P006', supplierId: 'sup-3' },
  { id: 'p-07', name: '大陸妹A', categoryId: 'cat-1', unit: '台斤', defaultCode: 'P007', supplierId: 'sup-3' },
  { id: 'p-08', name: '龍鬚菜', categoryId: 'cat-1', unit: '台斤', defaultCode: 'P008', supplierId: 'sup-3' },
  { id: 'p-09', name: '地瓜葉A', categoryId: 'cat-1', unit: '台斤', defaultCode: 'P009', supplierId: 'sup-3' },
  { id: 'p-10', name: '蚵白菜A', categoryId: 'cat-1', unit: '台斤', defaultCode: 'P010', supplierId: 'sup-3' },
  // 根莖類
  { id: 'p-11', name: '紅蘿蔔', categoryId: 'cat-2', unit: '台斤', defaultCode: 'P011', supplierId: 'sup-4' },
  { id: 'p-12', name: '白蘿蔔-台*', categoryId: 'cat-2', unit: '台斤', defaultCode: 'P012', supplierId: 'sup-4' },
  { id: 'p-13', name: '馬鈴薯(台)', categoryId: 'cat-2', unit: '台斤', defaultCode: 'P013', supplierId: 'sup-4' },
  { id: 'p-14', name: '洋蔥(台)中', categoryId: 'cat-2', unit: '顆', defaultCode: 'P014', supplierId: 'sup-4' },
  { id: 'p-15', name: '紫洋蔥(進)', categoryId: 'cat-2', unit: '台斤', defaultCode: 'P015', supplierId: 'sup-2' },
  { id: 'p-16', name: '牛蒡', categoryId: 'cat-2', unit: '台斤', defaultCode: 'P016', supplierId: 'sup-4' },
  { id: 'p-17', name: '老薑', categoryId: 'cat-2', unit: '台斤', defaultCode: 'P017', supplierId: 'sup-4' },
  // 瓜果類
  { id: 'p-18', name: '小黃瓜', categoryId: 'cat-3', unit: '台斤', defaultCode: 'P018', supplierId: 'sup-3' },
  { id: 'p-19', name: '大黃瓜', categoryId: 'cat-3', unit: '台斤', defaultCode: 'P019', supplierId: 'sup-3' },
  { id: 'p-20', name: '牛蕃茄-中大', categoryId: 'cat-3', unit: '台斤', defaultCode: 'P020', supplierId: 'sup-3' },
  { id: 'p-21', name: '茄子', categoryId: 'cat-3', unit: '台斤', defaultCode: 'P021', supplierId: 'sup-3' },
  { id: 'p-22', name: '南瓜', categoryId: 'cat-3', unit: '台斤', defaultCode: 'P022', supplierId: 'sup-3' },
  { id: 'p-23', name: '冬瓜', categoryId: 'cat-3', unit: '台斤', defaultCode: 'P023', supplierId: 'sup-3' },
  { id: 'p-24', name: '絲瓜', categoryId: 'cat-3', unit: '台斤', defaultCode: 'P024', supplierId: 'sup-3' },
  // 辛香料
  { id: 'p-25', name: '綠辣椒', categoryId: 'cat-4', unit: '台斤', defaultCode: 'P025', supplierId: 'sup-1' },
  { id: 'p-26', name: '糯米椒', categoryId: 'cat-4', unit: '台斤', defaultCode: 'P026', supplierId: 'sup-1' },
  { id: 'p-27', name: '九層塔', categoryId: 'cat-4', unit: '台斤', defaultCode: 'P027', supplierId: 'sup-1' },
  { id: 'p-28', name: '香菜', categoryId: 'cat-4', unit: '台斤', defaultCode: 'P028', supplierId: 'sup-1' },
  { id: 'p-29', name: '薑絲', categoryId: 'cat-4', unit: '台斤', defaultCode: 'P029', supplierId: 'sup-1' },
  { id: 'p-30', name: '老薑片', categoryId: 'cat-4', unit: '台斤', defaultCode: 'P030', supplierId: 'sup-1' },
  { id: 'p-31', name: '大蒜仁(去頭尾)', categoryId: 'cat-4', unit: '台斤', defaultCode: 'P031', supplierId: 'sup-1' },
  { id: 'p-32', name: '青蔥', categoryId: 'cat-4', unit: '台斤', defaultCode: 'P032', supplierId: 'sup-4' },
  // 菇豆類
  { id: 'p-33', name: '玉米筍(盒)', categoryId: 'cat-5', unit: '盒', defaultCode: 'P033', supplierId: 'sup-4' },
  { id: 'p-34', name: '豆干', categoryId: 'cat-5', unit: '台斤', defaultCode: 'P034', supplierId: 'sup-4' },
  { id: 'p-35', name: '三角油豆腐', categoryId: 'cat-5', unit: '台斤', defaultCode: 'P035', supplierId: 'sup-4' },
  { id: 'p-36', name: '韭菜', categoryId: 'cat-5', unit: '把', defaultCode: 'P036', supplierId: 'sup-4' },
  // 水果類
  { id: 'p-37', name: '香蕉(條/斤)', categoryId: 'cat-6', unit: '台斤', defaultCode: 'P037', supplierId: 'sup-4' },
  { id: 'p-38', name: '芭樂(顆/斤)', categoryId: 'cat-6', unit: '台斤', defaultCode: 'P038', supplierId: 'sup-4' },
  { id: 'p-39', name: '葡萄(串/斤)', categoryId: 'cat-6', unit: '台斤', defaultCode: 'P039', supplierId: 'sup-4' },
  // 肉品類
  { id: 'p-40', name: '清雞腿肉', categoryId: 'cat-7', unit: '台斤', defaultCode: 'P040', supplierId: 'sup-5' },
  { id: 'p-41', name: '清肉雞丁', categoryId: 'cat-7', unit: '台斤', defaultCode: 'P041', supplierId: 'sup-5' },
  { id: 'p-42', name: '肉絲', categoryId: 'cat-7', unit: '台斤', defaultCode: 'P042', supplierId: 'sup-5' },
  { id: 'p-43', name: '綜肉', categoryId: 'cat-7', unit: '台斤', defaultCode: 'P043', supplierId: 'sup-5' },
  { id: 'p-44', name: '梅花肉', categoryId: 'cat-7', unit: '台斤', defaultCode: 'P044', supplierId: 'sup-5' },
  // 水產類
  { id: 'p-45', name: '吻仔魚', categoryId: 'cat-8', unit: '台斤', defaultCode: 'P045', supplierId: 'sup-6' },
  // 其他
  { id: 'p-46', name: '皮蛋', categoryId: 'cat-9', unit: '顆', defaultCode: 'P046', supplierId: 'sup-4' },
  { id: 'p-47', name: '中華豆腐', categoryId: 'cat-9', unit: '盒', defaultCode: 'P047', supplierId: 'sup-4' },
  { id: 'p-48', name: '榨菜絲250g', categoryId: 'cat-9', unit: '包', defaultCode: 'P048', supplierId: 'sup-4' },
  { id: 'p-49', name: '鹹蛋', categoryId: 'cat-9', unit: '顆', defaultCode: 'P049', supplierId: 'sup-4' },
]
