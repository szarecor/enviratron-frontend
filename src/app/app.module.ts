import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent }  from './app.component';
import { DaysSelectComponent }  from './DaysSelect.component';
import { ChamberButtonsComponent }  from './ChamberSelectButtons.component';
import  { ChamberVariablesMenuComponent } from './ChamberVariablesMenu.component';
import { SvgSchedulerComponent } from './SvgScheduler.component';
import { SubmitButtonComponent } from './SubmitButton.component';
import {ChamberDataService} from "./data.service";
//import {HttpModule} from '@angular/http';
import {HttpClientModule} from '@angular/common/http';
import {CurrentSelectionStateValidator} from "./CurrentSelectionStateValidator.service";

@NgModule({
  imports:      [ BrowserModule, FormsModule, HttpClientModule],
  declarations: [ AppComponent, DaysSelectComponent, ChamberButtonsComponent, ChamberVariablesMenuComponent
    , SvgSchedulerComponent, SubmitButtonComponent ],
  bootstrap:    [ AppComponent ]
  , providers: [ChamberDataService, CurrentSelectionStateValidator]
})
export class AppModule {




}
