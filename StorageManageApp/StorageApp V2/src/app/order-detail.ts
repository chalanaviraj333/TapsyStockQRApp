import { Remoteorder } from "./remoteorder";
import { Remoteshellorder } from "./remoteshellorder";

export interface OrderDetail {
  key: string;
  year: number;
  month: number;
  remoteList?: Array<Remoteorder>;
  remoteshelllist?: Array<Remoteshellorder>;
}
