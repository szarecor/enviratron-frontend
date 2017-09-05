/**
 * Created by szarecor on 6/7/17.
 */
import {Component, Input, Output, EventEmitter} from '@angular/core';
import { ChamberDataService } from './data.service';


@Component({
    selector: 'days-select',
    // This was poorly documented and difficult to find:
    interpolation: ['[[', ']]'],
    templateUrl: './days_select_template.html'
})


export class DaysSelectComponent  {
    private dayCount: number = 0;
    private selectedDays: number[] = [];
    private completedDays: number[] = [];
    // to be populated by ngOnInit() method:
    days:number[] = [];

    // This is fired when there is a change on the days <select> list, see the template for (ngModelChange)
    selectedDaysChangeHandler(selectedDays: number[]) {
        this.dataService.setSelectedDays(selectedDays)
    }


  constructor(private dataService: ChamberDataService) {

    let _this = this;

    this.dataService.getDays().subscribe(function(days: any[]) {
      _this.selectedDays = days;

    });

    _this.dayCount = this.dataService.getDayCount();

    // Initialize the array of day identifiers:
    this.days = Array.from(
      Array(this.dayCount).keys(),
      function(i) {
        return i+1;
      }
    );

  }


  //ngOnInit() {}


}

