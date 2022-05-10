# JavaScript to QueryParam

This example shows a basic proxy that converts a simple, single-level JSON document 
posted into the endpoint to a series of query parameters sent to the target.

For example, if the following were posted:

```json
{
	"foo": "bar",
	"baz": "quux"
}
```

The resulting back end query would be:

`GET https://<backend>/.../?foo=bar&baz=quux`

The backend that is used for this example is the httpbin.org/anything endpoint,
so that you can see reflected back what the backend saw.

This simple implementation does not check to ensure the proper HTTP verb is used.  
The implementation cannot work with GET, DELETE, OPTIONS, or other payload-less verbs.  
It should work equally well with POST, PUT or PATCH, so long as your content-type is 
set to a proper JSON type.

## Setup

To deploy this API, simply zip the apiproxy directory and deploy using the 
"import bundle" feature in Apigee.

You will need to add an [API product](https://cloud.google.com/apigee/docs/api-platform/publish/create-api-products) that contains this bundle, and a [developer](https://cloud.google.com/apigee/docs/api-platform/publish/adding-developers-your-api-product#add) with [an app](https://cloud.google.com/apigee/docs/api-platform/publish/creating-apps-surface-your-api#register) that uses the product created.  This is used to generate the API key verified as one of the initial steps.

## Usage

Once deployed and with your API Product, developer and app created, you can submit a simple JSON document to the endpoint using a tool of your choice.

```shell
curl --location --request POST 'https://<yourserver>/j2q/asdf?apikey=nf5mXBxp3Fp9GydFshSZd47SRMv5OODIGrhgrBjGS4grKfLp' \
     --header 'Content-Type: application/json' \
     --data-raw '{"foo":"bar","baz":"quux"}'
```

response:

Your payload may have different headers depending on how your endpoints are deployed.

The important part to note is the "args" collection, and the arguments on the URL property.  

```json
{
    "args": {
        "baz": "quux",
        "foo": "bar"
    },
    "data": "{\"foo\":\"bar\",\"baz\":\"quux\"}",
    "files": {},
    "form": {},
    "headers": {
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Length": "26",
        "Content-Type": "application/json",
        "Grpc-Trace-Bin": "AABBuF66XKSZr6+ustGqLeMbAa71HPIO7FIeAgA",
        "Host": "httpbin.org",
        "Traceparent": "00-41b85eba5ca499afafaeb2d1aa2de31b-aef51cf20eec521e-00",
        "X-B3-Sampled": "0",
        "X-B3-Spanid": "aef51cf20eec521e",
        "X-B3-Traceid": "41b85eba5ca499afafaeb2d1aa2de31b",
        "X-Cloud-Trace-Context": "41b85eba5ca499afafaeb2d1aa2de31b/12607014557851603486;o=0",
        "X-Envoy-Attempt-Count": "1"
    },
    "json": {
        "baz": "quux",
        "foo": "bar"
    },
    "method": "GET",
    "origin": "1.2.5.4",
    "url": "https://httpbin.org/anything/asdf?foo=bar&baz=quux"
}
```