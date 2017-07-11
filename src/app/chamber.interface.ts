/**
 * Created by szarecor on 6/26/17.
 */

export interface Chamber {

  id: number;
  isChecked?: boolean;

}


export interface EnvironmentalVariableTimePoint {
  type: string;
  timePoint: any;
  day: number;
  value: number;
  chamberId: number;

}
