import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { BaseService } from '../services/base.service';
import Plant from '../services/plants.service';

@Injectable({
  providedIn: 'root',
})
export class PlantsApiService extends BaseService {
  plantsInfoApiUrl = '/api/plantsInfo';
  plantsApiUrl = '/api/plants';
  imagesApiUrl = '/api/images';
  constructor(private http: HttpClient) {
    super();
  }
  postPlantInfoData(plantName: string): Observable<any> {
    // return this.http.post(this.getUrlBase() + this.plantsInfoApiUrl, formData, this.httpOptionsNonJson);
    return this.http.post(this.getUrlBase() + this.plantsInfoApiUrl, { "plantName": plantName }, this.httpOptions);
  }
  postFormData(formData: any): Observable<any> {
    return this.http.post(this.getUrlBase() + this.plantsApiUrl, formData, this.httpOptionsNonJson);
  }
  putFormData(formData: any): Observable<any> {
    return this.http.put(this.getUrlBase() + this.plantsApiUrl, formData, this.httpOptionsNonJson);
  }
  post(plant: Plant): Observable<any> {
    return this.http.post(this.getUrlBase() + this.plantsApiUrl, plant, this.httpOptions);
  }
  put(plant: Plant): Observable<any> {
    console.log("Updating plant " + plant.id)
    return this.http.put(this.getUrlBase() + this.plantsApiUrl, plant, this.httpOptions);
  }
  getImage(id: number): Observable<any> {
    return this.http.get(this.getUrlBase() + this.imagesApiUrl + '/' + id, { responseType: 'blob', headers: { 'Access-Control-Allow-Origin': '*' } })
  }
  get(
    id?: number,
  ): Observable<any> {
    if (id) {
      return this.http.get(
        this.getUrlBase() + this.plantsApiUrl + "?id=" + id,
        this.httpOptions
      );
    } else {
      return this.http.get(
        this.getUrlBase() + this.plantsApiUrl,
        this.httpOptions
      );
    }
  }
  delete(
    id: number,
  ): Observable<any> {
    return this.http.delete(
      this.getUrlBase() + this.plantsApiUrl + "/" + id,
      this.httpOptions);
  }
}
