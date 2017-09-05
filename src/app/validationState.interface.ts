/**
 * Created by szarecor on 8/4/17.
 */
export interface ValidationState {
  isValid?: boolean;
  daysValid?: boolean;
  chambersValid?: boolean;

  dayData?: object;
  days?: number[];
  chamberData?: any[];

  chamberIds?: number[];

}
