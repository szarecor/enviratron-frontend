/**
 * Created by szarecor on 6/22/17.
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import { Chamber } from './chamber.interface';


@Injectable()
export class ChamberDataService {


    private chambers = new BehaviorSubject<Chamber[]>([]);

    private selectedChamberIds = new BehaviorSubject<number[]>([]);

    private days : number = 20;
    private selectedDays = new BehaviorSubject<number[]>([]);

    private currentEnvironmentalParameter? = new BehaviorSubject<string>('');


    private timePoints = new BehaviorSubject<any[]>([]);

    private schedule = new BehaviorSubject<any[]>([]);


    /* SCHEDULE: */

    setSchedule(schedule: any[]) {


      //console.log("dataservice received", schedule)
      this.schedule.next(schedule);
    }


    getSchedule() {

      return this.schedule.asObservable();
    }


    /* CHAMBERS: */
    getChambers(): Observable<Chamber[]> {
        return this.chambers.asObservable();
    }


    getSelectedChambers() {
      console.log("getSelectedChambers called")

      //this.selectedChambers.next(this.chambers.value.filter((c) => c.isChecked));

      return this.selectedChamberIds.asObservable(); //.value.filter(chamber => chamber.isChecked).asObservable();



    }

    setChambers(chambers: Chamber[]) {
        console.log("setChambers called")
        console.log(chambers.filter((c) => c.isChecked));
        console.log("")
        this.chambers.next(chambers);
        this.selectedChamberIds.next(chambers.filter((c) => c.isChecked).map(c => c.id));

    }

    /* TIME POINTS */
    setTimePoints(timePoints: any[]) {
      this.timePoints.next(timePoints);
    }

    getTimePoints(): Observable<any[]> {

      return this.timePoints.asObservable();
    }


    /* DAYS: */

    getDayCount(): number {
      return this.days;
    }

    getDays(): Observable<number[]> {
      return this.selectedDays.asObservable();
    }




    setSelectedDays(days: number[]) {

        //console.log("new selectedDays:", days)
        this.selectedDays.next(days);

    }

    getCompletedDays(): number[] {
        return [2];
    }

    /* CHAMBER ENVIRONMENT PARAMETERS: */

    getCurrentEnvironmentalParameter() {

      return this.currentEnvironmentalParameter.asObservable();
    }

    getCurrentEnvironmentalParameterValue() {
      return this.currentEnvironmentalParameter.value;

    }

    setCurrentEnvironmentalParameter(environment: string) {


      this.currentEnvironmentalParameter.next(environment); //{name:environment});


    }


}
