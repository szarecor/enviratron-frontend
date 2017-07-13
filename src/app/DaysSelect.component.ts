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
    @Input() dayCount: number = 0;
    @Input() selectedDays: number[] = [];
    @Input() completedDays: number[] = [];
    // to be populated by ngOnInit() method:
    days: any =  [];
    dataService : any;

    // Emit an event for the parent to handle when there is a change on the days <select> list:
    //@Output() onDaysChange: EventEmitter<any> = new EventEmitter<any>();

    // This is fired when there is a change on the days <select> list, see the template for (ngModelChange)
    selectedDaysChangeHandler(selectedDays: number[]) {

        this.dataService.setSelectedDays(selectedDays)
        //this.onDaysChange.emit(selectedDays);
    }


  constructor(private ds: ChamberDataService) {
    this.dataService = ds; //ChamberDataService;

    let _this = this;

    this.dataService.getDays().subscribe(function(days: any[]) {

      _this.selectedDays = days;

    });


    /*
    this.dataService.getChambers().subscribe((chambers : number[]) => this.chambers = chambers );
    //this.dataService.getCurrentChambers().subscribe((chambers : number[]) => this.currentChambers = chambers );
    //this.currentChambers = this.dataService.getCurrentChambers();
    //let _that = this;

    this.dataService.getCurrentChambers().subscribe(function(chambers : number[]) {
      console.log('buttons comp receiving', chambers)
      this.currentChambers = chambers;
      console.log("and", this.currentChambers, this)
      //self.zone.run(() => {
      //  console.log('enabled time travel');
      //});

      //this.cd.markForCheck();
    });
    */

  }


  ngOnInit() {
        // Initialize the array of day identifiers:
        this.days = Array.from(
            Array(this.dayCount).keys(),
            function(i) {
                return i+1;
            }
        );
        // TODO: this shouldn't be hard-coded here:
        this.dataService.setSelectedDays([1])

    }


}

