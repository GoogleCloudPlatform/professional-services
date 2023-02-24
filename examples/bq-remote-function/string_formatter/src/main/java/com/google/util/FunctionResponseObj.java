package com.google.util;


import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;

import java.util.Arrays;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonPropertyOrder({
        "replies",
        "errorMessage"
})
public class FunctionResponseObj {
    @JsonProperty("replies")
    private String[] replies;
    @JsonProperty("errorMessage")
    private String errorMessage;

    @JsonProperty("replies")
    public String[] getReplies() {
        return replies;
    }

    @JsonProperty("replies")
    public void setReplies(String[] replies) {
        this.replies = replies;
    }

    @JsonProperty("errorMessage")
    public String getErrorMessage() {
        return errorMessage;
    }

    @JsonProperty("errorMessage")
    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    @Override
    public String toString() {
        return "{" +
                "replies:" + Arrays.toString(replies) +
                ", errorMessage:'" + errorMessage + '\'' +
                '}';
    }
}
