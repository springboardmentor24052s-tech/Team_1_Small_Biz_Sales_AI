import pandas as pd

# Load cleaned sales dataset
df = pd.read_csv("data/cleaned_sales_report.csv")

# Shuffle the dataset
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

# Split into 80% train and 20% test
split_index = int(len(df) * 0.8)

train_data = df.iloc[:split_index]
test_data = df.iloc[split_index:]

# Save the datasets
train_data.to_csv("train_data.csv", index=False)
test_data.to_csv("test_data.csv", index=False)

print("Train dataset created successfully!")
print("Train Shape:", train_data.shape)

print("\nTest dataset created successfully!")
print("Test Shape:", test_data.shape)