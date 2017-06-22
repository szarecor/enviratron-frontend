/**
 * Created by szarecor on 6/7/17.
 */

import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import { ChamberDataService } from './data.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
    selector: 'chamber-buttons',
    // This was poorly documented and difficult to find:
    interpolation: ['[[', ']]'],
    templateUrl: './chamber_buttons_template.html'
    //, providers: [ChamberDataService]
})


export class ChamberButtonsComponent implements OnInit {

    chambers: number[] = [];
    currentChambers: number[] = [];
    cd: any = null;
      // Emit an event for the parent to handle when there is a change to the currently selected chambers:
      @Output() onChambersChange: EventEmitter<any> = new EventEmitter<any>();
  dataService: any;
      // This is fired when there is a change on the days <select> list, see the template for (ngModelChange)
      selectedChambersChangeHandler(selectedChambers: string[]) {
        this.onChambersChange.emit(selectedChambers);
      }

  constructor(private cd: ChangeDetectorRef, private ds: ChamberDataService) {
    this.cd = cd;
    this.dataService = ds; //ChamberDataService;

    this.dataService.getChambers().subscribe((chambers : number[]) => this.chambers = chambers );
    //this.dataService.getCurrentChambers().subscribe((chambers : number[]) => this.currentChambers = chambers );
    //this.currentChambers = this.dataService.getCurrentChambers();
    //let _that = this;

    this.dataService.getCurrentChambers().subscribe(function(chambers : number[]) {

      console.log("what is current chambers in buttons comp?");
      console.log(chambers);
      this.currentChambers = chambers;
      this.cd.markForCheck();
    });


  }


  ngOnInit(): void {






    //console.log("----------------");
    //console.log(this.chambers);
    //console.log(this.currentChambers);

  }


    chamberButtonClick(v:any) {
        var _chambers = this.currentChambers

        if (_chambers.indexOf(v) === -1) {
            // Here we are adding a chamber to the selectedChambers []:
            _chambers.push(v);

        } else {
            // And here we are removing a chamber from the selectedChambers []:
            _chambers = _chambers.filter(function(oldVal) {
                return oldVal !== v;
            })
        }
        this.dataService.setCurrentChambers(_chambers);


      // emit the new data to the parent
      //this.selectedChambersChangeHandler(this.currentChambers);
    }

    allChambersButtonClick(ev:any) {
        //this.currentChambers = (this.currentChambers.length === this.chamberNames.length) ? [] : this.chamberNames;
          // emit the new data to the parent
          //this.selectedChambersChangeHandler(this.currentChambers);
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
