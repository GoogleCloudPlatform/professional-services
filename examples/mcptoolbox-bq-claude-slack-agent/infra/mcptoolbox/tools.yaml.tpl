sources:
  bq-hotels:
    kind: bigquery
    project: ${project_id}
    location: us
tools:
  search-hotels-by-name:
    kind: bigquery-sql
    source: bq-hotels
    description: Search for hotels based on name.
    parameters:
      - name: name
        type: string
        description: The name of the hotel.
    statement: SELECT * FROM `${dataset_id}.hotels` WHERE LOWER(name) LIKE LOWER(CONCAT('%', @name, '%'));
  search-hotels-by-location:
    kind: bigquery-sql
    source: bq-hotels
    description: Search for hotels based on location.
    parameters:
      - name: location
        type: string
        description: The location of the hotel.
    statement: SELECT * FROM `${dataset_id}.hotels` WHERE LOWER(location) LIKE LOWER(CONCAT('%', @location, '%'));
  book-hotel:
    kind: bigquery-sql
    source: bq-hotels
    description: >-
       Book a hotel by its ID. If the hotel is successfully booked, returns a NULL, raises an error if not.
    parameters:
      - name: hotel_id
        type: integer
        description: The ID of the hotel to book.
    statement: UPDATE `${dataset_id}.hotels` SET booked = TRUE WHERE id = @hotel_id;
  update-hotel:
    kind: bigquery-sql
    source: bq-hotels
    description: >-
      Update a hotel's check-in and check-out dates by its ID. Returns a message indicating whether the hotel was successfully updated or not.
    parameters:
      - name: checkin_date
        type: string
        description: The new check-in date of the hotel.
      - name: checkout_date
        type: string
        description: The new check-out date of the hotel.
      - name: hotel_id
        type: integer
        description: The ID of the hotel to update.
    statement: >-
      UPDATE `${dataset_id}.hotels` SET checkin_date = PARSE_DATE('%Y-%m-%d', @checkin_date), checkout_date = PARSE_DATE('%Y-%m-%d', @checkout_date) WHERE id = @hotel_id;
  cancel-hotel:
    kind: bigquery-sql
    source: bq-hotels
    description: Cancel a hotel by its ID.
    parameters:
      - name: hotel_id
        type: integer
        description: The ID of the hotel to cancel.
    statement: UPDATE `${dataset_id}.hotels` SET booked = FALSE WHERE id = @hotel_id;
toolsets:
  my-toolset:
    - search-hotels-by-name
    - search-hotels-by-location
    - book-hotel
    - update-hotel
    - cancel-hotel
