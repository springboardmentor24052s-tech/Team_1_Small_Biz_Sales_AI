import pandas as pd

# Load cleaned dataset
df = pd.read_csv("cleaned_sales_report.csv")

print("Dataset Loaded Successfully!")
print("Shape:", df.shape)
print(df.head())

import os

print("Current Working Directory:")
print(os.getcwd())

print("\nCSV File Being Read:")
print(os.path.abspath("cleaned_sales_report.csv"))

import pandas as pd

df = pd.read_csv("cleaned_sales_report.csv")

print("Shape:", df.shape)
print("\nOrder Status Count:")
print(df["Status"].value_counts())