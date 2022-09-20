package com.google.cloud.sandbox.exception;
import com.google.cloud.sandbox.api.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {
	private static final long serialVersionUID = 1L;

	private transient ApiResponse apiResponse;

	private String resource;
	private String fieldName;
	private Object fieldValue;

	public ResourceNotFoundException(String resource, String fieldName, Object fieldValue) {
		super();
		this.resource = resource;
		this.fieldName = fieldName;
		this.fieldValue = fieldValue;
	}

	public String getResource() {
		return resource;
	}

	public String getFieldName() {
		return fieldName;
	}

	public Object getFieldValue() {
		return fieldValue;
	}

	public ApiResponse getApiResponse() {
		return apiResponse;
	}

	private void setApiResponse() {
		String message = String.format("%s not found with %s: '%s'", resource, fieldName, fieldValue);

		apiResponse = new ApiResponse(Boolean.FALSE, message);
	}
}
