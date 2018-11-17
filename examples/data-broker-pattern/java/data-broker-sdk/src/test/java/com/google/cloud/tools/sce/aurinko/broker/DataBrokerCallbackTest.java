package com.google.cloud.tools.sce.aurinko.broker;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.concurrent.CountDownLatch;

import com.google.api.gax.rpc.ApiException;
import com.google.api.gax.rpc.StatusCode;

import org.junit.Before;
import org.junit.Test;

public class DataBrokerCallbackTest {

    private DataBrokerCallback callback;
    private final String MESSAGE_ID = "0123456789";

    @Before
    public void setup() {
        callback = new DataBrokerCallback();
    }

    @Test
    public void onFailureApiException()    {
        ApiException testException = mock(ApiException.class);
        StatusCode statusCode = mock(StatusCode.class);
        when(statusCode.getCode()).thenReturn(StatusCode.Code.INTERNAL);
        when(testException.getStatusCode()).thenReturn(statusCode);
        when(testException.isRetryable()).thenReturn(false);

        callback.onFailure(testException);

        assertTrue(callback.getFailure() instanceof ApiException);
        assertFalse(((ApiException)callback.getFailure()).isRetryable());
        assertEquals(((ApiException)callback.getFailure()).getStatusCode().getCode(), StatusCode.Code.INTERNAL);
    }

    @Test
    public void onFailureOtherException() {
        Exception testException = new Exception("Something went wrong");
        assertNotNull(callback);
        callback.onFailure(testException);
        assertFalse(callback.getFailure() instanceof ApiException);
    }

    @Test
    public void onFailureLatch() {
        CountDownLatch doneSignal = mock(CountDownLatch.class);
        Exception testException = new Exception("Something went wrong");
        callback.setLatch(doneSignal);
        callback.onFailure(testException);
        verify(doneSignal, times(1)).countDown();
    }

    @Test
    public void onFailureDontLatch() {
        CountDownLatch doneSignal = mock(CountDownLatch.class);
        Exception testException = new Exception("Something went wrong");
        callback.onFailure(testException);
        verify(doneSignal, times(0)).countDown();
    }

    @Test
    public void onFailureMessageIdNull() {
        Exception testException = new Exception("Something went wrong");
        callback.onFailure(testException);
        assertNull(callback.getMessageId());
    }

    @Test
    public void onSuccess() {
        callback.onSuccess(this.MESSAGE_ID);
        assertEquals(this.MESSAGE_ID, callback.getMessageId());
    }

    @Test
    public void onSuccessFailureNull() {
        callback.onSuccess(this.MESSAGE_ID);
        assertNull(callback.getFailure());
    }

    @Test
    public void onSuccessLatch() {
        CountDownLatch doneSignal = mock(CountDownLatch.class);
        callback.setLatch(doneSignal);
        callback.onSuccess(this.MESSAGE_ID);
        verify(doneSignal, times(1)).countDown();
    }

    @Test
    public void onSuccessDontLatch() {
        CountDownLatch doneSignal = mock(CountDownLatch.class);
        callback.onSuccess(this.MESSAGE_ID);
        verify(doneSignal, times(0)).countDown();
    }


}