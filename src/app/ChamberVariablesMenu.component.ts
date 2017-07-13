/**
 * Created by szarecor on 6/8/17.
 */

import {Component, Input, Output, EventEmitter} from '@angular/core';
import { ChamberDataService } from './data.service';
import {Observable} from "rxjs/Observable";

@Component({
  selector: 'chamber-variables-menu',
  // This was poorly documented and difficult to find:
  interpolation: ['[[', ']]'],
  templateUrl: './chamber_variables_menu_template.html'
})

export class ChamberVariablesMenuComponent  {
  @Input() defaultState: string = "Lighting";
  currentState? = new Observable<string>();


  dataService: any;

  //@Input() foobar: any;
  // Emit an event for the parent to handle when there is a change on the days <select> list:
  //@Output() onStateChange: EventEmitter<any> = new EventEmitter<any>();
  menuItems: string[] = ['Lighting', 'Temperature', 'Watering', 'Humidity', 'CO2'];


  constructor(private ds: ChamberDataService) {


    this.dataService = ds;
    //this.dataService.setCurrentEnvironmentalParameter(this.currentState);
    //this.currentState = this.dataService.getCurrentEnvironmentalParameter();


    this.dataService.getCurrentEnvironmentalParameter().subscribe(function(env) {
        this.currentState = env;
    })




  }


  ngOnInit(): void {
    // defaultState is an @Input param and not available in constructor():
    this.dataService.setCurrentEnvironmentalParameter(this.defaultState);

    this.currentState = this.dataService.getCurrentEnvironmentalParameter();

  }


  handleClick(newState: string) {
    //this.currentState = newState;
    this.dataService.setCurrentEnvironmentalParameter(newState);
    // emit the the new value to the parent component:
    //this.onStateChange.emit(this.currentState);
  }


}

