import pandas as pd
from sklearn.preprocessing import LabelEncoder

# Load the training dataset
test_df = pd.read_csv("data/test_data.csv")

# Display the first 5 rows
print(test_df.head(5))

# Display the dataset size
print("Dataset Shape:", test_df.shape)

# Remove unnecessary columns
columns_to_remove = ["index","Order ID","Style","SKU","ASIN","currency","ship-country"]

test_df = test_df.drop(columns=columns_to_remove)

print("\nRemaining Columns:")
print(test_df.columns)
print("\nNew Shape:", test_df.shape)

# Create one LabelEncoder object
encoder = LabelEncoder()

# List of categorical columns
categorical_columns = ["Status","Fulfilment","Sales Channel ","ship-service-level","Category","Size","Courier Status","ship-city","ship-state","promotion-ids","fulfilled-by"]

# Encode each categorical column
for column in categorical_columns:
    test_df[column] = encoder.fit_transform(test_df[column].astype(str))
print("\nEncoded Dataset:")
print(test_df.head())

# Convert Date column to datetime format
test_df["Date"] = pd.to_datetime(test_df["Date"])

# Extract useful date features
test_df["Year"] = test_df["Date"].dt.year
test_df["Month"] = test_df["Date"].dt.month
test_df["Day"] = test_df["Date"].dt.day
test_df["DayOfWeek"] = test_df["Date"].dt.dayofweek
test_df = test_df.drop(columns=["Date"])

print("\nDataset after Feature Engineering:")
print(test_df.head())
print("\nFinal Shape:", test_df.shape)

# Convert B2B from True/False to 1/0
test_df["B2B"] = test_df["B2B"].astype(int)

# Save the processed test dataset
test_df.to_csv("data/test_data_processed.csv", index=False)
print("\nProcessed dataset saved successfully!")