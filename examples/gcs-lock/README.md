## GCS Lock

This example uses the [Google Cloud Storage generation preconditions feature](https://cloud.google.com/storage/docs/generations-preconditions#_Preconditions) 
to create a consistent locking mechanism that can be used as a mutex. It is intended to fix concurrency issues when 
writing to a database or working on a shared resource. GCS Lock can be used to do protected, globally 
serialized work within a Java [try-with-resources](https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html)
statement. It can also be integrated with a [Dataflow](https://cloud.google.com/dataflow) job to serve as a pessimistic 
lock.

An alternative for [HDFS](https://hadoop.apache.org/docs/r1.2.1/hdfs_design.html) and GCS users is the Hadoop connector 
which has a cooperative locking feature as described in
[this blog](https://cloud.google.com/blog/products/data-analytics/new-release-of-cloud-storage-connector-for-hadoop-improving-performance-throughput-and-more) 
and its [configuration documents](https://github.com/GoogleCloudDataproc/hadoop-connectors/blob/master/gcs/CONFIGURATION.md#cooperative-locking-feature-configuration).
It provides directory level semantics for isolated storage modification operations.

Also, see [this](https://github.com/marcacohen/gcslock) GitHub repository for a [Go](https://golang.org/) based GCS lock.

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

#### Alternatives
- [Cloud SQL](https://cloud.google.com/sql) was considered, but due to the limited number of connections on a SQL 
instance, it may not scale to the same degree as GCS.
- [Cloud Firestore](https://firebase.google.com/docs/firestore/security/overview) is a valid alternative in the case 
that you are not already using GCS.