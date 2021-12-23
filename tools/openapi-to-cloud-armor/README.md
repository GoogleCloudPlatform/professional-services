# OpenAPI to Cloud Armor converter
This tool is a simple converter for OpenAPI specifications to Cloud Armor rules. You can use it as part of your continuous delivery pipeline to configure your Cloud Armor rules based on your OpenAPI spec. This works well if you are developing using an API first approach or if you generate the OpenAPI spec as part of your build process.

To run the tool simply call the following, from within the directory.
```
go run main.go -input https://raw.githubusercontent.com/openapitools/openapi-generator/master/modules/openapi-generator/src/test/resources/3_0/petstore.yaml
```

The resulting yaml can be loaded into Cloud Armor using 
```
gcloud compute security-policies create <policy_name> --file-format yaml --file-name <filename>.yaml
```

The tool has the following parameters you can pass in:
| Name                          	| Default 	| Description                                                                                                                                                                                                   	|
|-------------------------------	|---------	|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------	|
| input                         	|         	| Input file OpenAPI3 spec, can either be a local path or a http or https URL (required)                                                                                                                        	|
| pathwise                      	| false   	| The pathwise format creates a single rule per path (paths that are included in other path expressions are ommited), it provides human readable rules (optional)                                               	|
| methodwise                    	| true    	| The methodwise format creates a rule per HTTP Method, the path expression is compressed to decrease size by ommitting paths that are covered by a regulare expression (optional)                              	|
| compressed                    	| false   	| Should you run into rule quotas you can try the compressed format, which tries to compact the API specification into a single rule. This has a risk of allowing unspecified methods on some paths. (optional) 	|
| defaultRule                   	| true    	| Should a default deny rule be generated (optional)                                                                                                                                                            	|
| defaultDenyResponseCode       	| 404     	| HTTP Status Code for the default deny rule (optional)                                                                                                                                                         	|
| priority                      	| 1000    	| Start priority for the rules (optional)                                                                                                                                                                       	|
| enableLayer7DdosDefenseConfig 	| false   	| Should the Layer 7 DDOS Defense be enabled https://cloud.google.com/armor/docs/adaptive-protection-overview (optional; default false)                                                                         	|