/*
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.google.cloud.storage.iam

import com.google.cloud.storage.iam.Model.{CustomRole,Group,Prefix,ServiceAccount,User}
import com.google.cloud.storage.iam.PolicyUtilConfig.{RoleGrant, SetValidator, ValidatingIdentityParser}
import org.scalatest.FlatSpec

class PolicyUtilConfigSpec extends FlatSpec {
  "Config" should "parse service account" in {
    val input = "serviceaccount1@project.iam.gserviceaccount.com"
    val expected = Some(ServiceAccount("serviceaccount1@project.iam.gserviceaccount.com"))
    val parser = ValidatingIdentityParser(projectValidator = new SetValidator(Set("project")))
    assert(parser.parseIdentity(input) == expected)
  }

  it should "parse identity" in {
    val examples = Seq(
      ("user:user1@example.com", Some(User("user1@example.com"))),
      ("user:user1@baddomain.com", None),
      ("group:group@example.com", Some(Group("group@example.com"))),
      ("group:group@baddomain.com", None),
      ("serviceAccount:serviceaccount@example-project.iam.gserviceaccount.com",
        Some(ServiceAccount("serviceaccount@example-project.iam.gserviceaccount.com")))
    )
    val parser = ValidatingIdentityParser(
      domainValidator = new SetValidator(Set("example.com")))
    for ((input,expected) <- examples)
      assert(parser.parseIdentity(input) == expected)
  }

  it should "parse role sets" in {
    val input =
      """# comment
        |[alpha]
        |project1 customRole1
        |roles/storage.objectCreator
        |
        |[bravo]
        |project2 customRole2   # comment
        |projects/project2/roles/customRole3
        |""".stripMargin
    val expected = Map(
      "alpha" -> Set(CustomRole("project1","customRole1"),
                     Model.ObjectCreator),
      "bravo" -> Set(CustomRole("project2","customRole2"),
                     CustomRole("project2","customRole3")))
    assert(PolicyUtilConfig.readRoleSets(input.lines) == expected)
  }

  it should "parse policies" in {
    val input =
      """# comment
      |[alpha]
      |roleSet1 idSet1
      |roleSet2 idSet2
      |
      |[bravo]
      |roleSet1 idSet3
      |roleSet2 idSet4""".stripMargin
    val expected = Seq(
      ("alpha", Seq(RoleGrant("roleSet1", "idSet1"),
                    RoleGrant("roleSet2", "idSet2"))),
      ("bravo", Seq(RoleGrant("roleSet1", "idSet3"),
                    RoleGrant("roleSet2", "idSet4"))))
    assert(PolicyUtilConfig.readPolicies(input.lines) == expected)
  }

  it should "parse zones" in {
    val input =
      """# comment
        |[alpha]
        |bucket1 prefix1/subdir
        |bucket2 prefix2/subdir
        |
        |[bravo]
        |bucket3 prefix3/subdir
        |bucket4 prefix4/subdir
        |bucket5
        |""".stripMargin
    val expected = Seq(
      ("alpha", Set(Prefix("bucket1","prefix1/subdir"),
                    Prefix("bucket2","prefix2/subdir"))),
      ("bravo", Set(Prefix("bucket3","prefix3/subdir"),
                    Prefix("bucket4","prefix4/subdir"),
                    Prefix("bucket5"))))
    assert(PolicyUtilConfig.readZones(input.lines) == expected)
  }

  it should "parse id sets" in {
    val input =
      """# comment
        |[alpha]
        |serviceaccount1@project1.iam.gserviceaccount.com
        |serviceaccount2@project2.iam.gserviceaccount.com
        |group1@example.com
        |user:user1@example.com
        |
        |[bravo]
        |serviceaccount3@project3.iam.gserviceaccount.com
        |serviceaccount4@project4.iam.gserviceaccount.com
        |group2@example.com
        |user:user2@example.com
        |""".stripMargin
    val expected = Seq(
      ("alpha", Set(
        ServiceAccount("serviceaccount1@project1.iam.gserviceaccount.com"),
        ServiceAccount("serviceaccount2@project2.iam.gserviceaccount.com"),
        Group("group1@example.com"),
        User("user1@example.com"))),
      ("bravo", Set(
        ServiceAccount("serviceaccount3@project3.iam.gserviceaccount.com"),
        ServiceAccount("serviceaccount4@project4.iam.gserviceaccount.com"),
        Group("group2@example.com"),
        User("user2@example.com")))
    )
    val parser = ValidatingIdentityParser(
      domainValidator = new SetValidator(Set("example.com")),
      projectValidator = new SetValidator(Set("project1","project2","project3", "project4")))
    assert(PolicyUtilConfig.readIdSets(input.lines, parser) == expected)
  }
}
