## GCS Lock

Uses the [Google Cloud Storage generation preconditions feature](https://cloud.google.com/storage/docs/generations-preconditions#_Preconditions) 
to create a consistent locking mechanism that can be used as a mutex. This can be used to do protected, globally 
serialized work within a Java
[try-with-resources](https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html) block. 

See [this](https://github.com/marcacohen/gcslock) GitHub repository for a [Go](https://golang.org/) based GCS lock.

#### How to Use
1. Set up a [Google Cloud Storage](https://cloud.google.com/storage) bucket where the lock files will reside.
2. Create a lock as follows:
```java
GcpLockFactory lockFactory = new GcpLockFactory(bucketName);
try (GcpLock gcpLock1 = lockFactory.createLock(lockName, timeout, unit)) {
    // Do protected work here
} catch (InterruptedException e) {
    e.printStackTrace();
}
```

#### Limitations

1. If a process acquires a lock and then dies before unlocking, the mutex will be deadlocked. In this case, one should 
consider setting up [life cycle management](https://cloud.google.com/storage/docs/lifecycle) rules for any locks that 
are older than a specific time interval, or age. Unfortunately, the minimum amount of time that can be specified for 
the [age condition](https://cloud.google.com/storage/docs/lifecycle#age) is one day, which is too long for most use 
cases. This limitation has been brought up as a feature request to the Google Cloud Storage team for more granular 
object lifetime configurations.