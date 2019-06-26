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
  - user_song_ranks: for each user, rank each (user, song) pair by the number
      of times the user listened to the song.
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
        COUNT(*) AS user_song_listens
      FROM `listenbrainz.listenbrainz.listen`
      JOIN songs ON songs.song = CONCAT(track_name, " by ", artist_name)
      WHERE track_name != ""
      GROUP BY user_name, song
    ),
    user_song_ranks AS (
      SELECT user, song, user_song_listens,
        ROW_NUMBER() OVER (PARTITION BY user ORDER BY user_song_listens DESC)
          AS rank
      FROM user_songs
    ),
    user_features AS (
      SELECT user, ARRAY_AGG(song) AS top_10,
        MAX(user_song_listens) AS user_max_listen
      FROM user_song_ranks
      WHERE rank <= 10
      GROUP BY user
    ),
    item_features AS (
      SELECT CONCAT(track_name, " by ", artist_name) AS song,
        SPLIT(ANY_VALUE(tags), ",") AS tags,
        COUNT(DISTINCT(release_name)) AS albums
      FROM `listenbrainz.listenbrainz.listen`
      WHERE track_name != ""
      GROUP BY song
    )
  SELECT user, song, artist, tags, albums, top_10,
    user_song_listens/user_max_listen AS count_norm
  FROM user_songs
  JOIN user_features USING(user)
  JOIN item_features USING(song)
"""
