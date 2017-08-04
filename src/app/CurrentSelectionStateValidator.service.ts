/**
 * Created by szarecor on 8/4/17.
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {ChamberDataService} from './data.service';
import { Chamber } from './chamber.interface';
import { ValidationState } from './validationState.interface';

@Injectable()
export class CurrentSelectionStateValidator {

  private isValid:boolean = true; //new BehaviorSubject<boolean>(true);
  //private dataService:any;

  private state = new BehaviorSubject<ValidationState>({});

  private environment:string;
  private chambers:number[] = [];
  private schedule:any[] = [];
  private days:number[] = [];

  constructor(private dataService: ChamberDataService) {
    //this.dataService = dataService;

    console.log("VALIDATION SERVICE")
    console.log(this.dataService);

    // The data to watch:

    let _this = this;

    this.dataService.getCurrentEnvironmentalParameter().subscribe(function (env) {
      _this.environment = env;
      console.log("VALIDATION SERVICE RECEIVED ENVIRONMENT", this.environment);
    });


    this.dataService.getSelectedChambers().subscribe(function (chambers) {
      _this.chambers = chambers;
      console.log("VALIDATION SERVICE RECEIVED CHAMBERS", this.chambers);
    });


    this.dataService.getSchedule().subscribe(function(schedule: any[]) {
        _this.schedule = schedule;
	      console.log("VALIDATION SERVICE RECEIVED SCHEDULE", this.schedule);
    });


    this.dataService.getDays().subscribe(function (days) {
      _this.days = days;
      console.log("VALIDATION SERVICE RECEIVED DAYS", this.days);
      console.log(_this);

    });

    _this.state.next({isValid: true});


    window.setTimeout(function() {

      console.log(_this);
      _this.state.next({isValid: false});

    }, 500);


  } // END constructor() METHOD


  getState() {
    return this.state.asObservable();
  }
}
