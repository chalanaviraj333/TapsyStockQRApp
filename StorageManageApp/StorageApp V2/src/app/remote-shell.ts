import { Car } from "./car";
import { RemoteNote } from "./remote-note";

export interface RemoteShell {
  key: string;
  tapsycode: string;
  boxnumber: number;
  remotetype: string;
  qtyavailable: number;
  productType: string;
  compitablebrands: Array<string>;
  image: string;
  inbuildblade: string;
  buttons: string
  notes: Array<RemoteNote>;
  inStock: boolean;
}
