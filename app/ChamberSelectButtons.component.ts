/**
 * Created by szarecor on 6/7/17.
 */

/**
 * Created by szarecor on 6/7/17.
 */
import {Component, Input, Output, EventEmitter} from '@angular/core';



@Component({
    selector: 'chamber-buttons',
    // This was poorly documented and difficult to find:
    interpolation: ['[[', ']]'],
    templateUrl: './chamber_buttons_template.html'
})


export class ChamberButtonsComponent  {

    @Input() chamberNames: string[] = [];
    @Input() selectedChambers: string[] = [];

      // Emit an event for the parent to handle when there is a change to the currently selected chambers:
      @Output() onChambersChange: EventEmitter<any> = new EventEmitter<any>();

      // This is fired when there is a change on the days <select> list, see the template for (ngModelChange)
      selectedChambersChangeHandler(selectedChambers: string[]) {
        this.onChambersChange.emit(selectedChambers);
      }


    chamberButtonClick(v:any) {


        if (this.selectedChambers.indexOf(v) === -1) {
            // Here we are adding a chamber to the selectedChambers []:
            this.selectedChambers.push(v);

        } else {
            // And here we are removing a chamber from the selectedChambers []:
            this.selectedChambers = this.selectedChambers.filter(function(oldVal) {
                return oldVal !== v;
            })
        }

      // emit the new data to the parent
      this.selectedChambersChangeHandler(this.selectedChambers);
    }

    allChambersButtonClick(ev:any) {
        this.selectedChambers = (this.selectedChambers.length === this.chamberNames.length) ? [] : this.chamberNames;
          // emit the new data to the parent
          this.selectedChambersChangeHandler(this.selectedChambers);
    }

    /*
    @Input() dayCount: number = 0;
    @Input() selectedDays: any[] = [];
    @Input() completedDays: any[] = [];
    // to be populated by ngOnInit() method:
    days: any =  [];

    // Emit an event for the parent to handle when there is a change on the days <select> list:
    @Output() onDaysChange: EventEmitter<any> = new EventEmitter<any>();

    // This is fired when there is a change on the days <select> list, see the template for (ngModelChange)
    selectedDaysChangeHandler(selectedDays) {
        this.onDaysChange.emit(selectedDays);
    }

    ngOnInit() {
        // Initialize the array of day identifiers:
        this.days = Array.from(
            Array(this.dayCount).keys(),
            function(i) {
                return i+1;
            }
        );

    }
    */

}
