package com.google.util;
import com.fasterxml.jackson.annotation.*;

import java.util.HashMap;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonPropertyOrder({
        "requestId",
        "caller",
        "sessionUser",
        "userDefinedContext",
        "calls"
})

public class remoteFunctionObject {
    @JsonProperty("requestId")
    private String requestId;
    @JsonProperty("caller")
    private String caller;
    @JsonProperty("sessionUser")
    private String sessionUser;
    @JsonProperty("userDefinedContext")
    private UserDefinedContext userDefinedContext;
    @JsonProperty("calls")
    private String[][] calls = null;
    @JsonIgnore
    private Map<String, Object> additionalProperties = new HashMap<String, Object>();

    @JsonProperty("requestId")
    public String getRequestId() {
        return requestId;
    }

    @JsonProperty("requestId")
    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    @JsonProperty("caller")
    public String getCaller() {
        return caller;
    }

    @JsonProperty("caller")
    public void setCaller(String caller) {
        this.caller = caller;
    }

    @JsonProperty("sessionUser")
    public String getSessionUser() {
        return sessionUser;
    }

    @JsonProperty("sessionUser")
    public void setSessionUser(String sessionUser) {
        this.sessionUser = sessionUser;
    }

    @JsonProperty("userDefinedContext")
    public UserDefinedContext getUserDefinedContext() {
        return userDefinedContext;
    }

    @JsonProperty("userDefinedContext")
    public void setUserDefinedContext(UserDefinedContext userDefinedContext) {
        this.userDefinedContext = userDefinedContext;
    }

    @JsonProperty("calls")
    public String[][] getCalls() {
        return calls;
    }

    @JsonProperty("calls")
    public void setCalls(String[][] calls) {
        this.calls = calls;
    }

    @JsonAnyGetter
    public Map<String, Object> getAdditionalProperties() {
        return this.additionalProperties;
    }

    @JsonAnySetter
    public void setAdditionalProperty(String name, Object value) {
        this.additionalProperties.put(name, value);
    }

    public remoteFunctionObject() {
        super();
    }
}
