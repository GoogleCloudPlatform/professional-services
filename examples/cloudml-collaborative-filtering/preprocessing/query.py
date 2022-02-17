# Copyright 2019 Google Inc. All Rights Reserved.

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""BigQuery query to feed into Dataflow.

This query is broken down into different subqueries:
  - songs: limit the universe of songs to just the top n most played.
  - user_songs: get (user, song) pairs and corresponding features.
  - user_tags: get the counts for each (user, tag) pair.
  - top_tags: get the 20 most frequent tags.
  - tag_table: initialize a num_users x top_tags table.
  - user_tag_features: fill in the tag_table using the counts from user_tags.
  - user_features: construct features specific to each user.
  - item_features: construct features specific to each item.
"""

query = """
  WITH
    songs AS (
      SELECT CONCAT(track_name, " by ", artist_name) AS song
      FROM `listenbrainz.listenbrainz.listen`
      GROUP BY song
      ORDER BY COUNT(*) DESC
      LIMIT 10000
    ),
    user_songs AS (
      SELECT user_name AS user, ANY_VALUE(artist_name) AS artist,
        CONCAT(track_name, " by ", artist_name) AS song,
        SPLIT(ANY_VALUE(tags), ",") AS tags,
        COUNT(*) AS user_song_listens
      FROM `listenbrainz.listenbrainz.listen`
      JOIN songs ON songs.song = CONCAT(track_name, " by ", artist_name)
      WHERE track_name != ""
      GROUP BY user_name, song
    ),
    user_tags AS (
      SELECT user, tag, COUNT(*) AS COUNT
      FROM user_songs,
      UNNEST(tags) tag
      WHERE tag != ""
      GROUP BY user, tag
    ),
    top_tags AS (
      SELECT tag
      FROM user_tags
      GROUP BY tag
      ORDER BY SUM(count) DESC
      LIMIT 20
    ),
    tag_table AS (
      SELECT user, b.tag
      FROM user_tags a, top_tags b
      GROUP BY user, b.tag
    ),
    user_tag_features AS (
      SELECT user,
        ARRAY_AGG(IFNULL(count, 0) ORDER BY tag) as user_tags
      FROM tag_table
      LEFT JOIN user_tags USING (user, tag)
      GROUP BY user
    ), user_features AS (
      SELECT user, MAX(user_song_listens) AS user_max_listen,
        ANY_VALUE(user_tags) as user_tags
      FROM user_songs
      LEFT JOIN user_tag_features USING (user)
      GROUP BY user
      HAVING COUNT(*) < 5000 AND user_max_listen > 2
    ),
    item_features AS (
      SELECT CONCAT(track_name, " by ", artist_name) AS song,
        COUNT(DISTINCT(release_name)) AS albums
      FROM `listenbrainz.listenbrainz.listen`
      WHERE track_name != ""
      GROUP BY song
    )
  SELECT user, song, artist, tags, albums, user_tags,
    IF(user_song_listens > 2,
       SQRT(user_song_listens/user_max_listen),
       1/user_song_listens) AS weight,
    IF(user_song_listens > 2, 1, 0) as label
  FROM user_songs
  JOIN user_features USING(user)
  JOIN item_features USING(song)
"""
