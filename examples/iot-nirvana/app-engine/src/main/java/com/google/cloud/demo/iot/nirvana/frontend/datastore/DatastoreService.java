/*
 * Copyright (C) 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

package com.google.cloud.demo.iot.nirvana.frontend.datastore;

import static com.googlecode.objectify.ObjectifyService.ofy;

import com.google.appengine.api.utils.SystemProperty;
import com.google.appengine.api.utils.SystemProperty.Environment.Value;
import com.googlecode.objectify.Key;
import com.googlecode.objectify.LoadResult;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.cmd.Query;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Class that provides functions to interact with DataStore using Objecitfy */
public class DatastoreService<E> {
  private final Class<E> c;
  private static Set<String> classes = new HashSet<String>();

  public DatastoreService(Class<E> c) {
    this.c = c;
    registerClass(c);
    if (SystemProperty.environment.value() != Value.Production) {
      ObjectifyService.begin();
    }
  }

  public static void registerClass(Class<?> c) {
    String classId = c.getPackage() + c.getName();
    if (!classes.contains(classId)) {
      synchronized (classes) {
        if (!classes.contains(classId)) {
          ObjectifyService.factory().register(c);
          classes.add(classId);
        }
      }
    }
  }

  public void clearSessionCache() {
    ofy().clear();
  }

  public E save(E e) {
    ofy().save().entity(e).now();
    return e;
  }

  public List<E> getByFilterKey(
      Object parentKeyOrEntity,
      String filterKey,
      Object filterValue,
      boolean orderByKey,
      int limit) {
    Query<E> query = ofy().load().type(c).ancestor(parentKeyOrEntity);
    query = query.filterKey(filterKey, filterValue);
    return query.orderKey(orderByKey).limit(limit).list();
  }

  public List<E> list() {
    Query<E> query = ofy().load().type(c);
    return query.list();
  }

  public LoadResult<Key<E>> listKeysForParent(Object parentKeyOrEntity) {
    return ofy().load().type(c).ancestor(parentKeyOrEntity).keys().first();
  }
}
