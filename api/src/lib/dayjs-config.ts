// api/src/lib/dayjs-config.ts
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// 必要最小限のプラグインのみを追加（~4KB総サイズ）
// timezone plugin は使用せず、バンドルサイズを最適化
dayjs.extend(utc);
dayjs.extend(customParseFormat);

export { dayjs };