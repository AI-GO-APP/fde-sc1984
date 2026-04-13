export function isBeforeCutoff(cutoffTime: string, now?: Date): boolean {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(cutoffTime)) {
    throw new Error(`isBeforeCutoff: cutoffTime 格式必須為 "HH:mm"，收到 "${cutoffTime}"`)
  }
  const current = now ?? new Date()
  const [cutoffH, cutoffM] = cutoffTime.split(':').map(Number)
  const currentH = current.getHours()
  const currentM = current.getMinutes()

  const currentTotal = currentH * 60 + currentM
  // 截止時間 00:00 代表「隔天午夜」，即當天所有時間（< 24:00）都算截止前
  // 但 00:01 已是「過了那個午夜」，應為 false
  // 解法：若截止為 00:00，視作 24*60=1440 分鐘（跨日邏輯）
  // currentTotal 範圍 0~1439，若 currentH==0 且 currentM > 0，代表次日已過
  const cutoffTotal = (cutoffH === 0 && cutoffM === 0)
    ? 24 * 60   // 1440：只有「當天」才算截止前，次日（00:01~）為 false
    : cutoffH * 60 + cutoffM

  // currentTotal 在 00:00 截止時：
  // 23:59 → 1439 < 1440 → true ✓
  // 00:00 → 0    < 1440 → true（但測試沒有這個 case，合理）
  // 00:01 → 1    < 1440 → true？← 問題所在
  //
  // 00:01 應為 false，表示次日凌晨已過截止
  // 需要區分「當天」與「次日」：若截止是 00:00（午夜），
  // currentH 為 0（即 00:xx）時代表已跨過該午夜，應為 false
  if (cutoffH === 0 && cutoffM === 0) {
    // 午夜截止：只要現在是 00:xx 就算過了（無論幾分）
    if (currentH === 0) return false
    return true
  }

  return currentTotal < cutoffTotal
}
