import pandas as pd
from sklearn.preprocessing import LabelEncoder

# Load the training dataset
train_df = pd.read_csv("data/train_data.csv")

# Display the first 5 rows
print(train_df.head(5))

# Display the dataset size
print("Dataset Shape:", train_df.shape)

# Remove unnecessary columns
columns_to_remove = ["index","Order ID","Style","SKU","ASIN","currency","ship-country"]

train_df = train_df.drop(columns=columns_to_remove)

print("\nRemaining Columns:")
print(train_df.columns)
print("\nNew Shape:", train_df.shape)

# Create one LabelEncoder object
encoder = LabelEncoder()

# List of categorical columns
categorical_columns = ["Status","Fulfilment","Sales Channel ","ship-service-level","Category","Size","Courier Status","ship-city","ship-state","promotion-ids","fulfilled-by"]

# Encode each categorical column
for column in categorical_columns:
    train_df[column] = encoder.fit_transform(train_df[column].astype(str))
print("\nEncoded Dataset:")
print(train_df.head())

# Convert Date column to datetime format
train_df["Date"] = pd.to_datetime(train_df["Date"])

# Extract useful date features
train_df["Year"] = train_df["Date"].dt.year
train_df["Month"] = train_df["Date"].dt.month
train_df["Day"] = train_df["Date"].dt.day
train_df["DayOfWeek"] = train_df["Date"].dt.dayofweek
train_df = train_df.drop(columns=["Date"])

print("\nDataset after Feature Engineering:")
print(train_df.head())
print("\nFinal Shape:", train_df.shape)

# Convert B2B from True/False to 1/0
train_df["B2B"] = train_df["B2B"].astype(int)

# Save the processed training dataset
train_df.to_csv("data/train_data_processed.csv", index=False)
print("\nProcessed dataset saved successfully!")