import pandas as pd
from sklearn.preprocessing import LabelEncoder

# Load dataset
df = pd.read_csv("data/cleaned_sales_report.csv")

print(df.head(5))

print(df.shape)

# Load dataset
df = pd.read_csv(
    r"C:\Users\Komal kumari\OneDrive\Desktop\Sale Report.csv",
    low_memory=False
)

# Remove unwanted column
df.drop(columns=["Unnamed: 22"], inplace=True)

# Remove rows with missing Amount
df.dropna(subset=["Amount"], inplace=True)

# Fill missing values
df["Courier Status"] = df["Courier Status"].fillna("Unknown")
df["promotion-ids"] = df["promotion-ids"].fillna("No Promotion")
df["fulfilled-by"] = df["fulfilled-by"].fillna("Not Specified")

# Remove remaining rows with missing shipping information
df.dropna(
    subset=[
        "ship-city",
        "ship-state",
        "ship-postal-code",
        "ship-country"
    ],
    inplace=True
)

# Convert Date
df["Date"] = pd.to_datetime(df["Date"], format="%m-%d-%y")

# Save cleaned dataset
df.to_csv("cleaned_sales_report.csv", index=False)

print("✅ Data cleaning completed successfully!")
print("Final Shape:", df.shape)



X = df.drop(columns=["Amount"])
y = df["Amount"]

encoder = LabelEncoder()
df["Category"] = encoder.fit_transform(df["Category"])

train= pd.read_csv("data/cleaned_sales_report.csv")
print(train.head())
print(train.shape)
print(train.columns)
