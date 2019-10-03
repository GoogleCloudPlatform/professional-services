import { HttpRequest, HttpHeaders, HttpParams } from '@angular/common/http';
export declare class RestangularHelper {
    static createRequest(options: any): HttpRequest<any>;
    static createRequestQueryParams(queryParams: any): HttpParams;
    static createRequestHeaders(headers: any): HttpHeaders;
}
