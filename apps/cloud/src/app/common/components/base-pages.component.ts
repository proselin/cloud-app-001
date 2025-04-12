import { BaseComponent } from "./base.component";
import {Directive, OnInit} from '@angular/core';

@Directive()
export abstract class BasePagesComponent extends BaseComponent implements OnInit {
    ngOnInit() {
    }
}
