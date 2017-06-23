/**
 * Created by szarecor on 6/22/17.
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';
import {BehaviorSubject} from "rxjs/BehaviorSubject";

@Injectable()
export class ChamberDataService {


  private chambers = new BehaviorSubject<number[]>([1,2,3,4,5,6,7,8]);
  private currentChambers = new BehaviorSubject<number[]>([]);

  /*
   getChambers(): Promise<number[]> {




   return Promise.resolve([1, 2, 3, 4, 5, 6, 7, 8])
   //, 'chamber 4', 'chamber 5', 'chamber 6', 'chamber 7', 'chamber 8'];

   }*/

    getChambers(): Observable<number[]> {
        return this.chambers.asObservable();
    }


    setChambers(chambers: number[]) {
        console.log('setChambers called')
        this.chambers.next(chambers);
    }


    getCurrentChambers(): Observable<number[]> {
        return this.currentChambers.asObservable();
    }


    setCurrentChambers(chambers: number[]) {
        console.log('setCurrentChambers called', chambers)
        this.currentChambers.next(chambers);
    }


getDayCount(): number {

  return 12;
}

getSelectedDays(): number[] {
  return [1,5,6,7];

}

getCompletedDays(): number[] {

  return [2];
}


}
