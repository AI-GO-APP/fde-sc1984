// vfs/admin/src/utils/reportData.selftest.ts
// 用法：在瀏覽器 devtools 執行 import('./utils/reportData.selftest')
//      或在實作期間 main.tsx 暫時 import 一次跑完看 console。

import { customerCode, lineNote, lineUom } from './reportData';

function assert(cond: any, msg: string) {
  if (!cond) { console.error('❌', msg); throw new Error(msg); }
  console.log('✅', msg);
}

export function runReportDataSelfTest() {
  // ── customerCode ──
  assert(customerCode({ short_name: '炸料', custom_data: { region_tag_id: 't1' } }, { t1: { name: 'F33' } }) === 'F33炸料', 'customerCode 路線+簡稱');
  assert(customerCode({ name: '梵某餐廳', custom_data: { region_tag_id: 't2' } }, { t2: { name: 'F60' } }) === 'F60梵某餐', 'customerCode 無 short_name 取 name 前 3 字');
  assert(customerCode({ short_name: '五股' }, {}) === '五股', 'customerCode 無 region_tag_id 只回簡稱');
  assert(customerCode({ short_name: '五股', custom_data: { region_tag_id: 'gone' } }, {}) === '五股', 'customerCode tag 已刪除 → fallback 到簡稱');
  assert(customerCode(undefined, {}) === '', 'customerCode undefined 客戶 → 空字串');

  // ── lineNote ──
  assert(lineNote({ custom_data: { note: '直徑3-4cm' } }) === '直徑3-4cm', 'lineNote 取 custom_data.note');
  assert(lineNote({ custom_data: null }) === '', 'lineNote null custom_data → 空字串');
  assert(lineNote({}) === '', 'lineNote 無 custom_data → 空字串');

  // ── lineUom ──
  const productsById = { p1: { id: 'p1', uom_id: 'u1' }, p2: { id: 'p2', uom_id: ['u2', '顆'] } };
  const uomMap = { u1: '台斤', u2: '顆' };
  assert(lineUom({ product_template_id: 'p1' }, productsById, uomMap) === '台斤', 'lineUom 純字串 uom_id');
  assert(lineUom({ product_template_id: ['p2'] }, productsById, uomMap) === '顆', 'lineUom array 形式 uom_id');
  assert(lineUom({ product_template_id: 'unknown' }, productsById, uomMap) === '', 'lineUom 找不到 product → 空字串');

  console.log('🎉 reportData helpers self-test passed');
}

if (typeof window !== 'undefined') {
  (window as any).__runReportDataSelfTest = runReportDataSelfTest;
}
