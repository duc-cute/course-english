import dayjs from "dayjs";
import "dayjs/locale/vi";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("vi");

export const APP_TIMEZONE = "Asia/Ho_Chi_Minh";

export { dayjs };
