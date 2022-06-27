/*
Copyright 2022 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

package functions.eventpojos;

import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.TableId;

/*
 * Class to store references of GCP client resources.
 * Stores references for BigQuery, Region and Network client.
 * Reference for BigQuery table also.
 * */
public class GCPResourceClient {
  private BigQuery bigQuery;
  private TableId tableId;

  public BigQuery getBigQuery() {
    return bigQuery;
  }

  public void setBigQuery(BigQuery bigQuery) {
    this.bigQuery = bigQuery;
  }

  public TableId getTableId() {
    return tableId;
  }

  public void setTableId(TableId tableId) {
    this.tableId = tableId;
  }
}
