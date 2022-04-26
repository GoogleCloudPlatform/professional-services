package com.google.cloud.load

case class GRecvLoadTestConfig(targetHost: String = "0.0.0.0",
                               targetPort: Int = 51771,
                               copybookPath: String = "",
                               sqlPath: String = "",
                               importFilePath: String = "",
                               bucket: String = "",
                               projectId: String = "",
                               location: String = "",
                               numberOfRequests: Int = 1,
                               exportRunMode: String = "storage_api",
                               keepAliveTimeInSeconds: Int = 480,
                               timeoutMinutes: Int = 30,
                               numberThreads: Int = 4,
                               testCase: String = "export",
                               useSsl: Boolean = false,
                               bqSchemaPath: String = "")

