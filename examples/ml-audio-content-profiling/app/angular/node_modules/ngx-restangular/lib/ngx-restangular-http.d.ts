import { HttpBackend, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpEvent } from '@angular/common/http/src/response';
export declare class RestangularHttp {
    http: HttpBackend;
    constructor(http: HttpBackend);
    createRequest(options: any): Observable<HttpEvent<any>>;
    request(request: HttpRequest<any>): Observable<HttpEvent<any>>;
}
