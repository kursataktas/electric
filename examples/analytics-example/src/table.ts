export const listingsTableName = `airbnb_listings`
export const listingsPrimaryKey = `listing_id`

// Create local tables to sync data into
export const createListingsTableSql = `
  CREATE TABLE IF NOT EXISTS ${listingsTableName} (
    ${listingsPrimaryKey} INT PRIMARY KEY,
    name TEXT,
    host_id INT,
    host_since DATE,
    host_location TEXT,
    host_response_time TEXT,
    host_response_rate DECIMAL(3, 2),
    host_acceptance_rate DECIMAL(3, 2),
    host_is_superhost BOOLEAN,
    host_total_listings_count INT,
    host_has_profile_pic BOOLEAN,
    host_identity_verified BOOLEAN,
    neighbourhood TEXT,
    district TEXT,
    city TEXT,
    latitude DECIMAL(8, 5),
    longitude DECIMAL(8, 5),
    property_type TEXT,
    room_type TEXT,
    accommodates INT,
    bedrooms INT,
    amenities TEXT[],
    price DECIMAL(10, 2),
    minimum_nights INT,
    maximum_nights INT,
    review_scores_rating INT,
    review_scores_accuracy INT,
    review_scores_cleanliness INT,
    review_scores_checkin INT,
    review_scores_communication INT,
    review_scores_location INT,
    review_scores_value INT,
    instant_bookable BOOLEAN
  );
`
